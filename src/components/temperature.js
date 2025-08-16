import { setTemperature as setTemperatureAction } from '../../redux/store/planner';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Skeleton } from 'moti/skeleton';
import { useEffect, useState } from 'react';
import { Text, View, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';

const LAST_GPS_LOCATION_KEY = 'lastGPSLocation';

export default function Weather() {
  const [temperature, setTemperature] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const dispatch = useDispatch();

  const fetchTemperature = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
      const res = await fetch(url);
      const data = await res.json();
      const temp = data.current?.temperature_2m;
      if (temp !== undefined) {
        setTemperature(temp);
        dispatch(setTemperatureAction(temp));
      } else {
        setErrorMsg('Temperature not found');
      }
    } catch {
      setErrorMsg('Failed to fetch temperature');
    } finally {
      setLoading(false);
    }
  };

  const saveLastGPSLocation = async (location) => {
    try {
      await AsyncStorage.setItem(LAST_GPS_LOCATION_KEY, JSON.stringify(location));
    } catch {}
  };

  const getLastGPSLocation = async () => {
    try {
      const lastLocation = await AsyncStorage.getItem(LAST_GPS_LOCATION_KEY);
      return lastLocation ? JSON.parse(lastLocation) : null;
    } catch {
      return null;
    }
  };

  const getLocationFromIP = async () => {
    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      if (data.status === 'success') {
        setLocationName(`${data.city} (Network)`);
        fetchTemperature(data.lat, data.lon);
      } else {
        throw new Error('IP location failed');
      }
    } catch {
      setErrorMsg('Unable to get location');
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS auto-handles via plist
  };

  const getUserLocationAndTemp = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      const lastGPSLocation = await getLastGPSLocation();
      if (lastGPSLocation) {
        setLocationName(`${lastGPSLocation.city} (Last GPS)`);
        fetchTemperature(lastGPSLocation.latitude, lastGPSLocation.longitude);
        return;
      }
      await getLocationFromIP();
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // iOS/Android reverse geocode API (Google, Nominatim, etc.)
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            'Unknown Location';
          const region = geoData.address?.state || '';
          const locationLabel = `${city}${region ? ', ' + region : ''}`;

          await saveLastGPSLocation({
            latitude,
            longitude,
            city,
            region,
            country: geoData.address?.country || '',
            timestamp: Date.now(),
          });

          setLocationName(locationLabel);
          fetchTemperature(latitude, longitude);
        } catch {
          setErrorMsg('Reverse geocoding failed');
          fetchTemperature(latitude, longitude);
        }
      },
      async (error) => {
        console.log('GPS Error:', error);
        const lastGPSLocation = await getLastGPSLocation();
        if (lastGPSLocation) {
          setLocationName(`${lastGPSLocation.city} (Last GPS)`);
          fetchTemperature(lastGPSLocation.latitude, lastGPSLocation.longitude);
        } else {
          await getLocationFromIP();
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getUserLocationAndTemp();
  }, []);

  return (
    <View style={{ padding: 10 }}>
      {loading ? (
        // <Skeleton.Group show={loading}>
        //   <Skeleton width={180} height={20} radius={6}>
        //     <Text style={{ color: '#666', fontSize: 14 }}>📍 {locationName}</Text>
        //   </Skeleton>
        //   <Skeleton width={100} height={24} radius={6}>
        //     <Text style={{ color: 'black', fontSize: 16 }}>{temperature}°C</Text>
        //   </Skeleton>
        // </Skeleton.Group>
        <ActivityIndicator size={'large'} />
      ) : errorMsg ? (
        <Text style={{ color: 'red' }}>{errorMsg}</Text>
      ) : (
        <>
          <Text style={{ color: '#666', fontSize: 14 }}>{locationName}</Text>
          <Text style={{ color: 'black', fontSize: 16 }}>{temperature}°C</Text>
        </>
      )}
    </View>
  );
}
