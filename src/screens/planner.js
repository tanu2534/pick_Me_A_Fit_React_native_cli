import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import RNCalendarEvents from 'react-native-calendar-events';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import RecommendationComponent from '../components/recommendationComponent';
import { responsiveHeight } from '../utility/responsive';

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [markedEvents, setMarkedEvents] = useState({});
  const [allEvents, setAllEvents] = useState([]);
  const [eventsOnToday, setEventsOnToday] = useState([]);
    const temp = useSelector((state) => state.planner.temperature);
    const [manualOutfitStep, setManualOutfitStep] = useState('tops');
      const [showManualSelection, setShowManualSelection] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
    const [dynamicCategories, setDynamicCategories] = useState([]); 
    const [plannedOutfitForDate, setPlannedOutfitForDate] = useState(null);
    const navigation = useNavigation();
    
  const isFocused = useIsFocused();

  useEffect(() => {
    const checkPlannedOutfit = async () => {
      if (selectedDate) {
        try {
          const plannedOutfits = await AsyncStorage.getItem("@plannedOutfits");
          if (plannedOutfits) {
            const planned = JSON.parse(plannedOutfits);
            const dateKey = selectedDate;
            
            if (planned[dateKey]) {
              setPlannedOutfitForDate(planned[dateKey]);
            } else {
              setPlannedOutfitForDate(null);
            }
          } else {
            setPlannedOutfitForDate(null);
          }
        } catch (error) {
          console.error("Error checking planned outfit:", error);
          setPlannedOutfitForDate(null);
        }
      }
    };

    checkPlannedOutfit();
  }, [selectedDate]);
 const loadWardrobeItems = async () => {
    try {
      let items = await AsyncStorage.getItem("@smartWardrobeItems");
      items = JSON.parse(items) || [];
      setWardrobeItems(items);
      
      // Extract unique categories from wardrobe items
      const uniqueCategories = [...new Set(items.map(item => item.category?.toLowerCase()).filter(Boolean))];
      setDynamicCategories(uniqueCategories);
      
      // Set first category as default if available
      if (uniqueCategories.length > 0 && !manualOutfitStep) {
        setManualOutfitStep(uniqueCategories[0]);
      }
    } catch (error) {
      console.error("Error loading wardrobe:", error);
    }
  };

  useEffect(() => {
    loadWardrobeItems();
  }, []);

   const getItemsByCategory = (category) => {
    return wardrobeItems.filter(item => 
      item.category?.toLowerCase() === category?.toLowerCase()
    );
  };

  const handleManualOutfitSave = async () => {
    if (selectedItems.length < 2) {
      Alert.alert('Incomplete Outfit', 'Please select at least 2 items for your outfit');
      return;
    }

    try {
      const dateKey = selectedDate || new Date().toISOString().split('T')[0];
      
      const manualOutfitData = {
        items: selectedItems,
        plannedAt: new Date().toISOString(),
        outfitNumber: 1, // Manual outfit
        date: dateKey,
        isManual: true
      };
      
      // Save to planned outfits
      let plannedOutfits = await AsyncStorage.getItem("@plannedOutfits");
      plannedOutfits = JSON.parse(plannedOutfits) || {};
      plannedOutfits[dateKey] = manualOutfitData;
      
      await AsyncStorage.setItem("@plannedOutfits", JSON.stringify(plannedOutfits));
      
      // Reset states
      setSelectedItems([]);
      setShowManualSelection(false);
      setManualOutfitStep('tops');
      
      Alert.alert('Success!', `Outfit planned for ${new Date(dateKey).toLocaleDateString()}! 🎀`);
      
    } catch (error) {
      console.error("Error saving manual outfit:", error);
      Alert.alert('Error', 'Failed to save outfit');
    }
  };

  // Toggle item selection
  const toggleItemSelection = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

   const renderManualSelectionModal = () => (
    <Modal
      visible={showManualSelection}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header - same as before */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0'
        }}>
          <TouchableOpacity onPress={() => {
            setShowManualSelection(false);
            setSelectedItems([]);
            setManualOutfitStep(dynamicCategories[0] || '');
          }}>
            <Text style={{ fontSize: 16, color: '#d36491', fontFamily: 'Raleway-SemiBold' }}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontFamily: 'Raleway-Bold', color: '#333' }}>
            Create Outfit for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'}
          </Text>
          
          <TouchableOpacity onPress={handleManualOutfitSave}>
            <Text style={{ fontSize: 16, color: '#d36491', fontFamily: 'Raleway-SemiBold' }}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Items Preview - same as before */}
        {selectedItems.length > 0 && (
          <View style={{ padding: 15, backgroundColor: '#fdf1f6' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Raleway-SemiBold', marginBottom: 10, color: '#d36491' }}>
              Selected Items ({selectedItems.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedItems.map((item, index) => (
                <View key={index} style={{ marginRight: 10, alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.uri }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      marginBottom: 5
                    }}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'Raleway-Medium',
                    color: '#666',
                    textAlign: 'center',
                    maxWidth: 60
                  }} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dynamic Category Tabs - THIS IS THE KEY CHANGE */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 15,
          backgroundColor: '#f8f8f8'
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10
            }}
          >
            {dynamicCategories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setManualOutfitStep(category)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 15,
                  borderRadius: 20,
                  backgroundColor: manualOutfitStep === category ? '#d36491' : '#fff',
                  marginHorizontal: 5
                }}
              >
                <Text style={{
                  color: manualOutfitStep === category ? '#fff' : '#666',
                  fontFamily: 'Raleway-SemiBold',
                  textTransform: 'capitalize'
                }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Items Grid - same as before but will now show dynamic categories */}
        <FlatList
          data={getItemsByCategory(manualOutfitStep)}
          numColumns={2}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => {
            const isSelected = selectedItems.some(selected => selected.id === item.id);
            return (
              <TouchableOpacity
                onPress={() => toggleItemSelection(item)}
                style={{
                  flex: 1,
                  margin: 5,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  overflow: 'hidden',
                  borderWidth: isSelected ? 3 : 0,
                  borderColor: isSelected ? '#d36491' : 'transparent'
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: '100%',
                    height: 120,
                    resizeMode: 'cover'
                  }}
                />
                <View style={{ padding: 10 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: 'Raleway-SemiBold',
                    color: '#333',
                    textAlign: 'center'
                  }} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'Raleway-Regular',
                    color: '#666',
                    textAlign: 'center',
                    textTransform: 'capitalize'
                  }}>
                    {item.category}
                  </Text>
                </View>
                
                {isSelected && (
                  <View style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: '#d36491',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{
                fontSize: 16,
                fontFamily: 'Raleway-Regular',
                color: '#666',
                textAlign: 'center'
              }}>
                No {manualOutfitStep} available
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  )

useEffect(() => {
  (async () => {
    try {
      // Permission request
      const permission = await RNCalendarEvents.requestPermissions();
      if (permission === 'authorized') {

        // Saare calendars lao
        const calendars = await RNCalendarEvents.findCalendars();
        const editableCalendars = calendars.filter(cal => cal.allowsModifications);
        const calendarIds = editableCalendars.map(cal => cal.id);

        // Next 30 days ke events
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const events = await RNCalendarEvents.fetchAllEvents(now.toISOString(), thirtyDaysLater.toISOString(), calendarIds);

        setAllEvents(events);

        // Marked events object
        const marked = {};
        events.forEach(event => {
          const date = new Date(event.startDate).toISOString().split('T')[0];
          marked[date] = {
            marked: true,
            dotColor: '#d36491',
          };
        });
        setMarkedEvents(marked);

        // Today events
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const eventsToday = await RNCalendarEvents.fetchAllEvents(startOfDay.toISOString(), endOfDay.toISOString(), calendarIds);

        if (eventsToday.length > 0) {
          setEventsOnToday(eventsToday);
        } else {
          setEventsOnToday(null);
        }
      }
    } catch (error) {
      console.error('Calendar error:', error);
    }
  })();
}, [isFocused]);

  // const addEventToCalendar = async (date) => {
  //   const calendars = await Calendarr.getCalendarsAsync();
  //   const defaultCalendar = calendars.find(cal => cal.allowsModifications);

  //   if (!defaultCalendar) {
  //     alert('No editable calendar found');
  //     return;
  //   }

  //   const startDate = new Date(date);
  //   startDate.setHours(10, 0, 0);

  //   const endDate = new Date(date);
  //   endDate.setHours(11, 0, 0);

  //   try {
  //     const eventId = await Calendarr.createEventAsync(defaultCalendar.id, {
  //       title: 'Smart Wardrobe Plan',
  //       startDate,
  //       endDate,
  //       timeZone: 'Asia/Kolkata',
  //       notes: 'Your outfit plan for today!',
  //     });

  //     // console.log('Event created:', eventId);
  //     alert('Plan added to calendar 🎀');
  //   } catch (err) {
  //     console.error('Failed to create event:', err);
  //   }
  // };

  const dateToShow = selectedDate || new Date().toISOString().split('T')[0];

const eventsForSelectedDate = allEvents.filter(event => {
  const eventDate = new Date(event.startDate).toISOString().split('T')[0];
  return eventDate === dateToShow;
});



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.profile}>
        <TouchableOpacity onPress={() => { navigation.goBack(); }} style={{ flexDirection: 'row', alignItems: 'center' }}>

          <Image source={require('../../assets/images/back.png')} style={{ height: 30, width: 30, marginVertical: 10 }} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '500', marginVertical: 10, fontFamily: 'Raleway-Bold' }}>Planner</Text>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          const today = new Date().toISOString().split('T')[0];
          console.log("today ", today, day)
          if(day.dateString === today) return
          setSelectedDate(day.dateString);
        }}
        markedDates={{
          ...markedEvents,
          [selectedDate]: {
            selected: true,
            selectedColor: '#d36491',
            selectedTextColor: '#fff',
            marked: markedEvents[selectedDate]?.marked || false,
            dotColor: markedEvents[selectedDate]?.dotColor || '#fff',
          },
        }}
        current={selectedDate}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          selectedDayBackgroundColor: '#d36491',
          todayTextColor: '#d36491',
          arrowColor: '#d36491',
          monthTextColor: '#d36491',
          textSectionTitleColor: '#d36491',
          dotColor: '#d36491',
          textDayFontFamily: 'Raleway-Regular',
          textMonthFontFamily: 'Raleway-SemiBold',
          textDayHeaderFontFamily: 'Raleway-Bold',
        }}
      />

      <ScrollView>
        {/* Show Create Custom Outfit button ONLY if no outfit is planned for that date */}
        {selectedDate !== '' && !plannedOutfitForDate && (
          <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setShowManualSelection(true)}
              style={{
                backgroundColor: '#d36491',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 15
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontFamily: 'Raleway-Bold'
              }}>
                Create Custom Outfit for {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show planned outfit info if exists */}
        {/* {plannedOutfitForDate && (
          <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
            <View style={{
              backgroundColor: '#e8f5e8',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: '#4CAF50'
            }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#2E7D32',
                  fontSize: 16,
                  fontFamily: 'Raleway-Bold'
                }}>
                  Outfit Already Planned!
                </Text>
                <Text style={{
                  color: '#388E3C',
                  fontSize: 14,
                  fontFamily: 'Raleway-Medium'
                }}>
                  {plannedOutfitForDate.isManual ? 'Custom outfit' : 'AI recommended outfit'} planned for {new Date(selectedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={async () => {
                // Remove planned outfit
                try {
                  let plannedOutfits = await AsyncStorage.getItem("@plannedOutfits");
                  plannedOutfits = JSON.parse(plannedOutfits) || {};
                  delete plannedOutfits[selectedDate];
                  await AsyncStorage.setItem("@plannedOutfits", JSON.stringify(plannedOutfits));
                  setPlannedOutfitForDate(null);
                  Alert.alert('Success', 'Planned outfit removed!');
                } catch (error) {
                  console.error("Error removing planned outfit:", error);
                  Alert.alert('Error', 'Failed to remove planned outfit');
                }
              }}
              style={{
                backgroundColor: '#ff6b6b',
                paddingVertical: 8,
                paddingHorizontal: 15,
                borderRadius: 6,
                alignSelf: 'flex-start',
                marginBottom: 15
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontFamily: 'Raleway-SemiBold'
              }}>
                Remove Planned Outfit
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Recommendations Component - will handle showing/hiding recommendations internally */}
        <View style={{ marginTop: 10 }}>
          <RecommendationComponent 
            selectedDate={selectedDate}
            temperature={25}
            hasPlannedOutfit={!!plannedOutfitForDate} // Pass this prop
            onOutfitSelected={(items, index, date) => {
              console.log('Outfit planned for:', date, items);
              // Refresh planned outfit state
              setPlannedOutfitForDate({
                items,
                plannedAt: new Date().toISOString(),
                outfitNumber: index + 1,
                date,
                isManual: false
              });
            }}
          />
        </View>
      </ScrollView>

 {!plannedOutfitForDate &&renderManualSelectionModal()}
    </View>
  );
};

export default Planner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // pastel pink background
    // padding: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backIcon: {
    height: 30,
    width: 30,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#d36491',
    fontFamily: 'Raleway-Bold',
  },
  calendar: {
    borderRadius: 10,
    // padding: 10,
    width: '95%',
    alignSelf: 'center',
    // borderWidth: 0.5,
    // borderColor: '#d36491',
    marginBottom: 20,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#d36491',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    width: '95%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Raleway-Bold',
  },
  profile: {
    height: responsiveHeight(8),
    width: '100%',
    // backgroundColor: '#d36491',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#9a9797',
  }
});