import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import RNCalendarEvents from 'react-native-calendar-events';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Image, ScrollView, StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Surface } from 'react-native-paper';
import { useSelector } from 'react-redux';
import RecommendationComponent from '../components/recommendationComponent';
import Wheather from '../components/temperature';
import OutfitRecommendationEngine from '../services/recommendation';
import { responsiveFontSize, responsiveHeight } from '../utility/responsive';
import { Colors } from '../constants/Colors';

export default function HomeScreen() {
  //console.log("this is index");
  const [washCycleMessage, setWashCycleMessage] = useState("stay Home #COVID19");

  const [userImage, setUserImage] = useState(null);
  const [user, setUser] = useState(null);
  const [eventToday, setEventToday] = useState(null);
  const isFocused = useIsFocused();
  const [showOptions, setShowOptions] = useState(false);
  const temp = useSelector((state) => state.planner.temperature);
  const [recommendation, setRecommendations] = useState(null);
  const [recommendationMessage, setRecommendationMessage] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [vibe, setVibe] = useState(1);
  const navigation = useNavigation();

  // Minimum required counts
  const MIN_TOPS = 2;
  const MIN_BOTTOMS = 2;
  const MIN_TOTAL = 5;

  const getWashCycleStatus = (washcycle) => {
    if (!washcycle) return "Set your wash cycle";

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    switch (washcycle.type) {
      case 'Daily':
        return "Wash day today!";

      case 'Weekly': {
        const washDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const washDayIndex = washDays.indexOf(washcycle.washDay);
        const todayIndex = today.getDay();

        if (washDayIndex === todayIndex) {
          return "Today is wash day!";
        } else {
          const daysUntilWash = (washDayIndex - todayIndex + 7) % 7;
          if (daysUntilWash === 1) {
            return "Wash day tomorrow!";
          } else {
            return `${daysUntilWash} days until wash day`;
          }
        }
      }

      case 'Bi-weekly': {
        const washDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const washDayIndex = washDays.indexOf(washcycle.washDay);
        const todayIndex = today.getDay();

        // Calculate next wash day (bi-weekly)
        const daysSinceLastWash = (todayIndex - washDayIndex + 14) % 14;
        const daysUntilNextWash = 14 - daysSinceLastWash;

        if (daysUntilNextWash === 14 || daysUntilNextWash === 0) {
          return "Today is wash day!";
        } else if (daysUntilNextWash === 1) {
          return "Wash day tomorrow!";
        } else if (daysUntilNextWash <= 7) {
          return `${daysUntilNextWash} days until wash day`;
        } else {
          return `${daysUntilNextWash} days until wash day`;
        }
      }

      case 'Monthly': {
        const washDate = washcycle.washDate || 1;
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), washDate);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, washDate);

        let nextWashDay;
        if (today <= thisMonth) {
          nextWashDay = thisMonth;
        } else {
          nextWashDay = nextMonth;
        }

        const timeDiff = nextWashDay.getTime() - todayDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff === 0) {
          return "Today is wash day!";
        } else if (daysDiff === 1) {
          return "Wash day tomorrow!";
        } else {
          return `${daysDiff} days until wash day`;
        }
      }

      case 'As needed':
        return "Wash as needed";

      default:
        return "Set your wash cycle";
    }
  };

  // Add this function to load wash cycle info
  const loadWashCycleInfo = async () => {
    try {
      const washcycle = await AsyncStorage.getItem("washcycle");
      if (washcycle) {
        const parsedWashCycle = JSON.parse(washcycle);
        const message = getWashCycleStatus(parsedWashCycle);
        setWashCycleMessage(message);
      } else {
        setWashCycleMessage("Set your wash cycle");
      }
    } catch (error) {
      console.error("Error loading wash cycle info:", error);
      setWashCycleMessage("Set your wash cycle");
    }
  };

  const hasEnoughItems = (wardrobe = []) => {
    const tops = wardrobe.filter(item =>
      ['tops', 'shirt', 'top', 'blouse', 't-shirt', 'tank'].includes(item.category));
    const bottoms = wardrobe.filter(item =>
      ['bottoms', 'pants', 'jean', 'shorts', 'trouser', 'skirt'].includes(item.category));
    return tops.length >= MIN_TOPS && bottoms.length >= MIN_BOTTOMS && wardrobe.length >= MIN_TOTAL;
  };

  function getLastWashDate(washcycle) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (washcycle.type) {
      case 'Daily':
        return today;

      case 'Weekly': {
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(washcycle.washDay);
        const diff = (today.getDay() - dayIndex + 7) % 7;
        const lastWash = new Date(today);
        lastWash.setDate(today.getDate() - diff);
        return lastWash;
      }

      case 'Bi-weekly': {
        const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(washcycle.washDay);
        const diff = (today.getDay() - dayIndex + 14) % 14;
        const lastWash = new Date(today);
        lastWash.setDate(today.getDate() - diff);
        return lastWash;
      }

      case 'Monthly': {
        const day = washcycle.washDate || 1;
        const thisMonthWash = new Date(today.getFullYear(), today.getMonth(), day);
        if (today >= thisMonthWash) return thisMonthWash;
        return new Date(today.getFullYear(), today.getMonth() - 1, day);
      }

      case 'As needed':
      default:
        return new Date(0); // oldest possible date
    }
  }

  function getUnwashedItems(wardrobeItems, washcycle) {
    const lastWashDate = getLastWashDate(washcycle);

    return wardrobeItems.filter(item => {
      if (!item.wearAt) {
        //console.log(`⏳ Item ${item.label || item.id} has no wearAt date, assuming it's clean`);
        return false;
      }
      const wornDate = new Date(item.wearAt);
      return wornDate > lastWashDate;
    });
  }

  // Function to handle "wear it today" button click
  const handleWearToday = async (outfitItems, outfitIndex) => {
    try {
      const currentDate = new Date().toISOString();

      // Get current wardrobe items
      let wardrobeItems = await AsyncStorage.getItem("@smartWardrobeItems");
      wardrobeItems = JSON.parse(wardrobeItems) || [];

      // Update wearAt field for selected outfit items
      const updatedWardrobe = wardrobeItems.map(item => {
        const outfitItem = outfitItems.find(oItem => oItem.id === item.id);
        if (outfitItem) {
          return {
            ...item,
            wearAt: currentDate
          };
        }
        return item;
      });

      // Save updated wardrobe back to AsyncStorage
      await AsyncStorage.setItem("@smartWardrobeItems", JSON.stringify(updatedWardrobe));

      // Save selected outfit info
      const selectedOutfitData = {
        items: outfitItems,
        selectedAt: currentDate,
        outfitNumber: outfitIndex + 1
      };

      await AsyncStorage.setItem("@todaySelectedOutfit", JSON.stringify(selectedOutfitData));
      setSelectedOutfit(selectedOutfitData);

      // Clear recommendations since user has selected an outfit
      setRecommendations(null);

    } catch (error) {
      console.error("Error updating wear date:", error);
    }
  };
  const loadRecommendations = async () => {
    try {
      //getting washcycle info

      const selectedOutfitData = await AsyncStorage.getItem("@todaySelectedOutfit");
      if (selectedOutfitData) {
        const outfit = JSON.parse(selectedOutfitData);
        const selectedDate = new Date(outfit.selectedAt);
        const today = new Date();

        if (selectedDate.toDateString() === today.toDateString()) {
          // User has already selected an outfit today, don't show recommendations
          setSelectedOutfit(outfit);
          return;
        }
      }

      let washcycle = await AsyncStorage.getItem("washcycle");
      washcycle = JSON.parse(washcycle);
      if (!washcycle) {
        //console.log(" Wash cycle not set by user");
        setRecommendationMessage("Wash cycle not set by user");
        return;
      }

      //getting wardrobe
      let Wardrobe = await AsyncStorage.getItem("@smartWardrobeItems");
      Wardrobe = JSON.parse(Wardrobe);
      if (!Wardrobe || !Array.isArray(Wardrobe) || Wardrobe.length === 0) {
        //console.log(" No wardrobe items found");
        setRecommendationMessage("No wardrobe items found. Please add wardrobe to get daily recommendations.");
        return;
      }

      if (!hasEnoughItems(Wardrobe)) {
        //console.log("Not enough wardrobe items to generate recommendations");
        setRecommendationMessage("Not enough wardrobe items to generate recommendations");
        return;
      }

      const unwashedItems = getUnwashedItems(Wardrobe, washcycle);
      const recentWornIds = unwashedItems.map(item => item.id);

      const engine = new OutfitRecommendationEngine();
      const recommendations = engine.recommendOutfits(Wardrobe, parseInt(temp), "casual", recentWornIds);

      setRecommendations(recommendations);
      //console.log("Recommendations:", recommendations[0]);

    } catch (error) {
      console.error("Error loading recommendations:", error);
      setRecommendationMessage("Error loading recommendations");
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [isFocused, temp]);

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 1,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        //console.log('User cancelled image picker');
      } else if (response.errorCode) {
        //console.log('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        await AsyncStorage.setItem('profileImage', uri);
        setUserImage(uri);
        setShowOptions(false);
      }
    });
  };

  const getTotalItems = async () => {
    try {
      const raw = await AsyncStorage.getItem('@smartWardrobeItems');
      const allItems = JSON.parse(raw) || [];
      //console.log("Total items:", allItems.length);
      return allItems.length;
    } catch (error) {
      console.error("Error fetching total items:", error);
      return 0;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let name = await AsyncStorage.getItem('name');
        setUser(name);
        let image = await AsyncStorage.getItem('profileImage');
        
        // Only use local file URIs, ignore HTTP URLs
        if (image && !image.startsWith('http')) {
          setUserImage(image);
        } else {
          // Clear invalid HTTP URL from storage
          if (image && image.startsWith('http')) {
            await AsyncStorage.removeItem('profileImage');
          }
          setUserImage(null);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    })();
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      await loadWashCycleInfo();

      // 📌 Permission request
      const status = await RNCalendarEvents.requestPermissions();
      if (status === 'authorized') {
        // 📌 Get editable calendars
        const calendars = await RNCalendarEvents.findCalendars();
        const editableCalendars = calendars.filter(cal => cal.allowsModifications);
        const calendarIds = editableCalendars.map(cal => cal.id);

        // 📌 Define today's start and end
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        let allEvents = [];

        // 📌 Loop through each calendar and get events
        for (let calId of calendarIds) {
          const events = await RNCalendarEvents.fetchAllEvents(
            startOfDay.toISOString(),
            endOfDay.toISOString(),
            [calId]
          );
          allEvents = [...allEvents, ...events];
        }

        if (allEvents.length > 0) {
          setEventToday(allEvents);
        } else {
          setEventToday(null);
          //console.log('❌ Aaj koi event nahi hai');
        }
      } else {
        Alert.alert('Permission Needed', 'Calendar access is required');
      }
    })();
  }, [isFocused]);

  useEffect(() => {
    const loadSelectedOutfit = async () => {
      try {
        const selectedOutfitData = await AsyncStorage.getItem("@todaySelectedOutfit");
        if (selectedOutfitData) {
          const outfit = JSON.parse(selectedOutfitData);
          const selectedDate = new Date(outfit.selectedAt);
          const today = new Date();

          // Check if selected outfit is for today
          if (selectedDate.toDateString() === today.toDateString()) {
            setSelectedOutfit(outfit);
          } else {
            // Clear old selection if it's from a previous day
            await AsyncStorage.removeItem("@todaySelectedOutfit");
          }
        }
      } catch (error) {
        console.error("Error loading selected outfit:", error);
      }
    };

    loadSelectedOutfit();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.profile, {
        alignItems: 'center', paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', height: 60
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 50, paddingHorizontal: 5 }}>
          <Image source={require('../../assets/images/wheather.png')} style={{ height: 30, width: 30, borderRadius: 10 }} />
          <Wheather />
        </View>
        <Text style={styles.titlemain}>Pick me a fit</Text>
        
        <TouchableOpacity onPress={() => setShowOptions(val => !val)}>
          <Image 
            source={userImage ? { uri: userImage } : require('../../assets/images/profile.png')} 
            style={{ 
              height: 40, 
              width: 40, 
              borderRadius: 50, 
              borderWidth: 4, 
              borderColor: Colors.surface,
              ...(userImage ? {} : { tintColor: Colors.terra })
            }} 
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.profile, { alignItems: 'flex-start', paddingHorizontal: 20, flexDirection: 'column', justifyContent: 'flex-start', height: 30 }]}>
        <Text style={{ color: Colors.brown, fontSize: 16, marginTop: 0, fontFamily: 'Raleway-Medium' }}>Hello, {user}!</Text>
        {/* <Text style={{ color: 'black', fontSize: 14, marginTop: 0, opacity: 0.6, fontFamily: 'Raleway-SemiBold' }}>{washCycleMessage}</Text> */}
      </View>

      {/* <Surface role='link' onTouchEnd={() => { 
        // router.navigate('/planner'); 
        navigation.navigate('Planner');

      }} elevation={2} style={{ backgroundColor: '#fff', height: responsiveHeight(12), width: '95%', marginTop: 0, alignSelf: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ScrollView style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, margin: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Raleway-SemiBold', marginBottom: 5 }}>
            {new Date().toDateString()}
          </Text>

          {eventToday?.length > 0 ? (
            eventToday.map((event, index) => (
              <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fdf1f6', borderRadius: 6 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Raleway-Bold', color: '#d36491' }}>
                  🎀 {event.title}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Raleway-Regular', color: '#555' }}>
                  🕘 {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 14, fontFamily: 'Raleway-Regular', color: '#aaa' }}>
              No events for today 🌸
            </Text>
          )}
        </ScrollView>

        <Image source={require('../../assets/images/cal.png')} style={{ height: 30, width: 30, marginHorizontal: 10 }} />
      </Surface>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, height: responsiveHeight(25), width: '95%', alignSelf: 'center', }}>
        <Surface onTouchEnd={() => {
          //  router.navigate('/Wardrobe');
          navigation.navigate('Wardrobe');

         }} elevation={2} style={{ width: '68%', height: '95%', backgroundColor: '#fff', alignSelf: 'center', borderRadius: 10 }}>
          <View style={{ flexDirection: 'row', width: '100%', height: '20%', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 5, marginHorizontal: 10, marginTop: 0, opacity: 0.6, fontFamily: 'Raleway-Bold' }}>Wardrobe</Text>
            <Image source={require('../../assets/images/hang.png')} style={{ height: 25, width: 25, marginHorizontal: 10 }} />
          </View>

          <Text style={{ fontSize: 45, fontWeight: '400', marginVertical: 0, marginHorizontal: 10, color: 'black', opacity: 0.7, fontFamily: 'Raleway-SemiBold' }}>{getTotalItems()}</Text>
          <Text style={{ fontSize: 14, fontWeight: '400', marginVertical: 0, marginHorizontal: 10, color: 'black', opacity: 0.6, fontFamily: 'Raleway-SemiBold' }}>Items</Text>
        </Surface>
        <View style={{ flexDirection: 'column', width: '30%', height: '100%', alignSelf: 'center', justifyContent: 'space-around' }}>
          <Surface role='link' onTouchEnd={() => {
            //  router.push('/addManually');
            navigation.navigate('addManually');
              }} elevation={2} style={{ width: '90%', height: '45%', alignSelf: 'center', borderRadius: 5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('../../assets/images/add.png')} style={{ height: 25, width: 25, marginHorizontal: 10 }} ></Image>
            <Text style={{ fontSize: 14, marginVertical: 0, marginHorizontal: 10, color: 'black', opacity: 0.6, fontFamily: 'Raleway-SemiBold' }}>Add Fits</Text>
          </Surface>
          <Surface 
          // role='link'
          //  onTouchEnd={() => { router.push('/scanning'); }} 
           elevation={2} style={{ width: '90%', height: '45%', alignSelf: 'center', borderRadius: 5, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('../../assets/images/scan2.png')} style={{ height: 25, width: 25, marginHorizontal: 10 }} ></Image>
            <Text style={{ fontSize: 14, marginVertical: 0, marginHorizontal: 10, color: 'black', opacity: 0.6, fontFamily: 'Raleway-SemiBold' }}>Scan Fits</Text>
            <Text style={{ fontSize: 10, marginVertical: 0, marginHorizontal: 10, color: 'black', opacity: 0.6, fontFamily: 'Raleway-SemiBold', fontStyle: 'italic' }}>(Coming Soon)</Text>
          </Surface>
        </View>
      </View>

<ScrollView style={{ flex: 1 }}>
<RecommendationComponent 
  temperature={temp}
  onOutfitSelected={(items, index, date) => {
    //console.log('Outfit selected on home screen:', items);
  }}
/>
</ScrollView> */}


      <View style={styles.stylebox}>
        <Text style={styles.peachText}>Today's Look</Text>
        <Text style={styles.bigtext}>What's the vibe today?</Text>
        <View style={styles.flexrawstyle}>
          <TouchableOpacity onPress={() => setVibe(0)} style={[styles.option, vibe === 0 && styles.selectedOption]}>
            <Image source={require('../../assets/images/flower.png')} style={{ height: 20, width: 20, marginRight: 5, tintColor: vibe === 0 ? '#fff' : Colors.terra }} />
            <Text style={[styles.brown, vibe === 0 && styles.selectedText]}>Soft</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVibe(1)} style={[styles.option, vibe === 1 && styles.selectedOption]}>
            <Image source={require('../../assets/images/fire.png')} style={{ height: 20, width: 20, marginRight: 5, tintColor: vibe === 1 ? '#fff' : Colors.terra }} />
            <Text style={[styles.brown, vibe === 1 && styles.selectedText]}>Bold</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVibe(2)} style={[styles.option, vibe === 2 && styles.selectedOption]}>
            <Image source={require('../../assets/images/happy.png')} style={{ height: 20, width: 20, marginRight: 5, tintColor: vibe === 2 ? '#fff' : Colors.terra }} />
            <Text style={[styles.brown, vibe === 2 && styles.selectedText]}>Playful</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button}>
            <Image source={require('../../assets/images/hanger.png')} style={{ height: 20, width: 20, marginRight: 5, tintColor: Colors.surface }} />
          <Text style={{ color: 'white', fontFamily: 'Raleway-Bold', fontSize: 16 }}>
            Generate Outfit
          </Text>
        </TouchableOpacity>

      </View>

      {/* quick actions  */}

      <Text style={[styles.titlemain, {textAlign:"left", marginLeft: '8%' , marginTop: 30}]}>Quick Actions</Text>

      <View style={[styles.flexrawstyle, {width: '88%',  alignSelf:"center"}]}>
        <TouchableOpacity style={styles.box} onPress={() => navigation.navigate('addManually')}>
          <View style={{backgroundColor:Colors.PeachUltraLight, height: 40, width: 40, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5}}>

          <Image source={require('../../assets/images/plus.png')} style={styles.boxIcon} />
          </View>
          <Text style={styles.boxText}>Add Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.box}>
          <View style={{backgroundColor:Colors.PeachUltraLight, height: 40, width: 40, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5}}>

          <Image source={require('../../assets/images/hanger.png')} style={styles.boxIcon} />
          </View>
          <Text style={styles.boxText}>AI Scan</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.box}>
         <View style={{backgroundColor:Colors.PeachUltraLight, height: 40, width: 40, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5}}>

          <Image source={require('../../assets/images/drop.png')} style={styles.boxIcon} />
          </View>
          <Text style={styles.boxText}>Wash Due</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.flexrawstyle, { justifyContent:'space-between', paddingHorizontal: '10%'}]}>
           <Text style={[styles.titlemain, ]}>This Week</Text>
           <Text style={[styles.peachText, {fontFamily:'Raleway-SemiBold'}]}>   {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric'  })}</Text>
      </View>

      {/* ab yaha ek week dikhana h raw mw  */}

     <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: '5%', marginTop: 10 }}>
  {Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    const isToday = date.toDateString() === new Date().toDateString();
    
    return (
      <TouchableOpacity key={i} style={{
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        backgroundColor: isToday ? Colors.terra : Colors.surface,
        minWidth: 45
      }}>
        <Text style={{ 
          fontSize: 10, 
          fontFamily: 'Raleway-SemiBold', 
          color: isToday ? '#fff' : Colors.brown 
        }}>
          {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
        </Text>
        <Text style={{ 
          fontSize: 16, 
          fontFamily: 'Raleway-Bold', 
          color: isToday ? '#fff' : Colors.brown,
          marginTop: 2
        }}>
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>


      {showOptions && (
        <View style={{
          position: 'absolute',
          top: 100,
          right: 20,
          backgroundColor: '#fff',
          borderRadius: 10,
          elevation: 5,
          paddingVertical: 10,
          paddingHorizontal: 15,
          zIndex: 999
        }}>
          <TouchableOpacity onPress={() => {
            setShowOptions(false);
            pickImage();
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Raleway-SemiBold', paddingVertical: 5 }}>Change Profile Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            setShowOptions(false);
            await AsyncStorage.clear();
            // router.navigate('/permission')
            navigation.navigate('permission');
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Raleway-SemiBold', paddingVertical: 5, color: 'red' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.cream
  },
  profile: {
    height: responsiveHeight(10),
    width: '100%',
    //  backgroundColor: '#d3649038',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  titlemain: {
    color: Colors.brown,
    fontFamily: 'Raleway-Bold',
    fontSize: responsiveFontSize(16),
    textAlign: 'center',
    marginBottom: 5
  },

  stylebox:{
    padding: 20,
    height: 200,
    width: '88%',
    alignSelf:"center",
    // backgroundColor: Colors.PeachUltraLight,
    borderRadius:10,
    backgroundColor : Colors.PeachUltraLight,
    boxShadow:`inset 50px 50px 95px ${Colors.PeachLight}, inset -50px -50px 95px ${Colors.cream}`
  },
  peachText:{
    color: Colors.terra,
    fontFamily: 'Raleway-Bold'
  },
  bigtext: {
    color: Colors.brown,
    fontFamily: 'Raleway-BoldItalic',
    fontSize: 25,
    // fontStyle:"italic"
    
  
  },
  flexrawstyle:{
    flexDirection:"row",
    justifyContent:"space-around",
    alignItems:"center",
    marginBlock: 15
  }
,
 button: {
    backgroundColor: Colors.terra,
    width: '88%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf:'center',
    paddingVertical: 11
  },
  option: {
    backgroundColor: Colors.surface,
    padding: 10,
    paddingVertical: 8, 
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'

  },
  brown:{
    color: Colors.brown,
    fontFamily: 'Raleway-SemiBold'
  },
  selectedOption: {
    backgroundColor: Colors.terra
  },
  selectedText: {
    color: '#fff'
  },
  box:{
    height: 90,
    width: 90,
    backgroundColor:Colors.surface,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  },
  boxIcon: {
    height: 24,
    width: 24,
    tintColor: Colors.terra,
    // marginBottom: 5
  },
  boxText: {
    fontSize: 11,
    fontFamily: 'Raleway-SemiBold',
    color: Colors.brown,
    textAlign: 'center'
  },
  comingSoon: {
    fontSize: 8,
    fontFamily: 'Raleway-Regular',
    color: Colors.terra,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2
  }

});
