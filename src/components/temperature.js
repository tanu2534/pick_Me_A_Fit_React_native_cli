import { setTemperature as setTemperatureAction } from '../../redux/store/planner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { Text, View, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';

const LAST_GPS_LOCATION_KEY = 'lastGPSLocation';

export default function Weather() {
  const [temperature, setTemperature] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const dispatch = useDispatch();
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);

  const fetchTemperature = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
      
      // Add timeout for weather API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      const temp = data.current?.temperature_2m;
      
      if (temp !== undefined && mountedRef.current) {
        setTemperature(temp);
        dispatch(setTemperatureAction(temp));
        //console.log('Temperature fetched:', temp);
        
        // Clear timeout once temperature is successfully fetched
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (mountedRef.current) {
        setErrorMsg('Temperature not found');
      }
    } catch (e) {
      //console.log('Temperature fetch error:', e);
      if (mountedRef.current) {
        setErrorMsg('Failed to fetch temperature');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const saveLastGPSLocation = async (location) => {
    try {
      await AsyncStorage.setItem(LAST_GPS_LOCATION_KEY, JSON.stringify(location));
      //console.log('GPS location saved successfully');
    } catch (error) {
      //console.log('Error saving GPS location:', error);
    }
  };

  const getLastGPSLocation = async () => {
    try {
      const lastLocation = await AsyncStorage.getItem(LAST_GPS_LOCATION_KEY);
      return lastLocation ? JSON.parse(lastLocation) : null;
    } catch (error) {
      //console.log('Error getting last GPS location:', error);
      return null;
    }
  };

  const getLocationFromIP = async () => {
    if (!mountedRef.current) return;
    
    try {
      //console.log('Fetching location from IP...');
      
      // Fix: Proper timeout implementation for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('http://ip-api.com/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      //console.log('IP Location data:', data);
      
      if (data.status === 'success' && mountedRef.current) {
        setLocationName(`${data.city} (Network)`);
        await fetchTemperature(data.lat, data.lon);
      } else {
        throw new Error('IP location service returned error');
      }
    } catch (error) {
      //console.log('IP Location Error:', error.message);
      if (mountedRef.current) {
        // Try alternative IP service as backup
        try {
          //console.log('Trying backup IP service...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          const response = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const data = await response.json();
          
          if (data.city && mountedRef.current) {
            setLocationName(`${data.city} (Network)`);
            await fetchTemperature(data.latitude, data.longitude);
            return;
          }
        } catch (backupError) {
          //console.log('Backup IP service also failed:', backupError);
        }
        
        setErrorMsg('Unable to get location');
        setLoading(false);
      }
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access to show weather information',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        //console.log('Permission result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        //console.log('Permission request error:', error);
        return false;
      }
    }
    return true;
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      //console.log('Starting reverse geocoding...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'WeatherApp/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);
      const data = await response.json();
      //console.log('Geocoding response received');
      
      if (data.address) {
        const city = data.address?.city || 
                     data.address?.town || 
                     data.address?.village || 
                     'Current Location';
        const region = data.address?.state || data.address?.region || '';
        
        return {
          city,
          region,
          country: data.address?.country || ''
        };
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      //console.log('Reverse geocoding failed:', error.message);
      return {
        city: 'Current Location',
        region: '',
        country: ''
      };
    }
  };

  const getUserLocationAndTemp = async () => {
    if (!mountedRef.current) return;
    
    try {
      //console.log('Starting location fetch...');
      
      const hasPermission = await requestLocationPermission();
      //console.log('Has location permission:', hasPermission);
      
      if (!hasPermission) {
        //console.log('Permission denied, checking last GPS location...');
        
        const lastGPSLocation = await getLastGPSLocation();
        if (lastGPSLocation && mountedRef.current) {
          //console.log('Using last GPS location');
          setLocationName(`${lastGPSLocation.city} (Last GPS)`);
          await fetchTemperature(lastGPSLocation.latitude, lastGPSLocation.longitude);
          return;
        }
        
        //console.log('No last GPS location, using IP location');
        await getLocationFromIP();
        return;
      }

      //console.log('Getting current position...');
      
      const locationPromise = new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            //console.log('GPS position obtained successfully');
            resolve(position);
          },
          (error) => {
            //console.log('GPS error:', error.code, error.message);
            reject(error);
          },
          {
            accuracy: {
              android: 'balanced',
              ios: 'best',
            },
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000, // 5 minutes
            distanceFilter: 0,
            forceRequestLocation: true,
            forceLocationManager: false,
            showLocationDialog: true,
          }
        );
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GPS_TIMEOUT')), 18000);
      });

      const location = await Promise.race([locationPromise, timeoutPromise]);
      
      if (!mountedRef.current) return;
      
      const { latitude, longitude } = location.coords;

      const locationData = await reverseGeocode(latitude, longitude);
      const locationName = `${locationData.city}${locationData.region ? ', ' + locationData.region : ''}`;
      
      const gpsLocationData = {
        latitude,
        longitude,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        timestamp: Date.now()
      };
      
      if (mountedRef.current) {
        await saveLastGPSLocation(gpsLocationData);
        setLocationName(locationName);
        await fetchTemperature(latitude, longitude);
      }
      
    } catch (error) {
      //console.log('GPS Location Error:', error.message);
      
      if (!mountedRef.current) return;
      
      // Try cached location first
      const lastGPSLocation = await getLastGPSLocation();
      if (lastGPSLocation) {
        //console.log('Using cached GPS location after GPS error');
        setLocationName(`${lastGPSLocation.city} (Last GPS)`);
        await fetchTemperature(lastGPSLocation.latitude, lastGPSLocation.longitude);
        return;
      }
      
      // Final fallback to IP location
      //console.log('No cached GPS, using IP location as final fallback');
      await getLocationFromIP();
    }
  };

  useEffect(() => {
    //console.log('Weather component mounted');
    mountedRef.current = true;
    
    // Start location fetch
    getUserLocationAndTemp();

    // Set safety timeout - only if component is still mounted and loading
    timeoutRef.current = setTimeout(() => {
      //console.log('Safety timeout check - loading:', loading, 'temperature:', temperature, 'errorMsg:', errorMsg);
      if (mountedRef.current && loading && !temperature && !errorMsg) {
        //console.log('Triggering final timeout error');
        setErrorMsg('Unable to get weather data');
        setLoading(false);
      }
    }, 30000); // Increased to 30 seconds

    return () => {
      //console.log('Weather component unmounting');
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <View style={{ padding: 10 }}>
      {loading ? (
        <View style={{ alignItems: 'flex-start', justifyContent: 'center', minHeight: 50 }}>
          <ActivityIndicator size="small" color="#d36491" />
          <Text
            style={{
              color: '#666',
              fontSize: 12,
              marginTop: 8,
              fontFamily: 'Raleway_Regular',
              fontWeight: '400',
            }}
          >
            Getting weather...
          </Text>
        </View>
      ) : errorMsg ? (
        <View>
          <Text style={{ color: 'red', fontSize: 14 }}>⚠️ {errorMsg}</Text>
        </View>
      ) : (
        <View>
          <Text
            style={{
              color: '#666',
              fontSize: 14,
              marginBottom: 5,
              fontFamily: 'Raleway_Regular',
              fontWeight: '500',
            }}
          >
            {locationName}
          </Text>
          <Text
            style={{
              color: 'black',
              fontSize: 16,
              opacity: 0.9,
              fontFamily: 'Raleway_Regular',
              fontWeight: '500',
            }}
          >
            {temperature}°C
          </Text>
        </View>
      )}
    </View>
  );
}