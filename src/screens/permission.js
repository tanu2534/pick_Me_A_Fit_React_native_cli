import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState , useRef} from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { Surface, TextInput } from 'react-native-paper';
import { responsiveFontSize, responsiveHeight } from '../utility/responsive';

const Permission = () => {
//   const AnimatedDressCarousel = () => {
//   const scrollY = useRef(new Animated.Value(0)).current;
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const dressesData = [
//     require('../../assets/images/dress1.png'),
//     require('../../assets/images/dress1.png'),
//     require('../../assets/images/dress1.png'),
//     require('../../assets/images/dress1.png'),
//     require('../../assets/images/dress1.png'),
//   ];

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentIndex((prevIndex) => {
//         const nextIndex = (prevIndex + 1) % dressesData.length;
        
//         Animated.timing(scrollY, {
//           toValue: nextIndex * 170, // item height + margin
//           duration: 1000,
//           useNativeDriver: true,
//         }).start();
        
//         return nextIndex;
//       });
//     }, 2500);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <View style={{
//       position: 'absolute',
//       right: 20,
//       top: Dimensions.get('window').height * 0.15,
//       height: Dimensions.get('window').height * 0.4,
//       width: 100,
//       overflow: 'hidden',
//     }}>
//       <Animated.View style={{
//         transform: [{ translateY: Animated.multiply(scrollY, -1) }]
//       }}>
//         {dressesData.map((dress, index) => (
//           <View key={index} style={{
//             height: 150,
//             width: 100,
//             marginVertical: 10,
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}>
//             <Image 
//               source={dress} 
//               style={{
//                 width: 80,
//                 height: 120,
//                 borderRadius: 10,
//               }}
//               resizeMode="cover"
//             />
//           </View>
//         ))}
//       </Animated.View>
//     </View>
//   );
// };
  const moodOptions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "🤩", label: "Excited" },
    { emoji: "😴", label: "Tired" },
    { emoji: "🥰", label: "Romantic" },
    { emoji: "😎", label: "Cool" },
  ];

  const washcycleOptions = [
    { emoji: "🧺", label: "Daily" , uri : require("../../assets/images/daily.png")},
    { emoji: "📅", label: "Weekly", uri : require("../../assets/images/weekly.png") },
    { emoji: "🗓️", label: "Bi-weekly" ,uri : require("../../assets/images/weekly.png")},
    { emoji: "🔄", label: "Monthly", uri : require('../../assets/images/monthly.png') },
    { emoji: "🎯", label: "As needed" , uri : require("../../assets/images/need.png")},
  ];

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthDays = Array.from({length: 31}, (_, i) => i + 1);
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [isNameValid, setIsNameValid] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedWashcycle, setSelectedWashcycle] = useState(null);
  const [washDay, setWashDay] = useState(null);
  const [washDate, setWashDate] = useState(null);
  const [customDays, setCustomDays] = useState(3);

  const pickImage = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 1,
      includeBase64: true,
    },
    (response) => {
      if (!response.didCancel && !response.errorCode) {
        setProfileImage(response.assets[0].uri);
      }
    }
  );
};


  useEffect(() => {
    const namevalid = name.replace(/\s/g, '').length >= 3;
    setIsNameValid(namevalid);
  }, [name])

  const isWashcycleComplete = () => {
    if (!selectedWashcycle) return false;
    
    switch(selectedWashcycle) {
      case 'Daily':
      case 'As needed':
        return true;
      case 'Weekly':
      case 'Bi-weekly':
        return washDay !== null;
      case 'Monthly':
        return washDate !== null;
      default:
        return false;
    }
  };

  const renderWashcycleDetails = () => {
    if (!selectedWashcycle) return null;

    switch(selectedWashcycle) {
      case 'Weekly':
      case 'Bi-weekly':
        return (
          <View style={{marginTop: 20, width: '100%'}}>
            <Text style={[styles.sectionTitle, {alignSelf: 'flex-start', marginLeft: '10%'}]}>
              Which day do you usually wash clothes?
            </Text>
            <View style={styles.optionsContainer}>
              {weekDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setWashDay(day)}
                  style={[
                    styles.dayOption,
                    { backgroundColor: washDay === day ? '#d36491' : 'white' }
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: washDay === day ? 'white' : '#d36491' }
                  ]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'Monthly':
        return (
          <View style={{marginTop: 20, width: '100%'}}>
            <Text style={[styles.sectionTitle, {alignSelf: 'flex-start', marginLeft: '10%'}]}>
              Which date of the month?
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
            >
              {monthDays.map((date) => (
                <TouchableOpacity
                  key={date}
                  onPress={() => setWashDate(date)}
                  style={[
                    styles.dateOption,
                    { backgroundColor: washDate === date ? '#d36491' : 'white' }
                  ]}
                >
                  <Text style={[
                    styles.dateText,
                    { color: washDate === date ? 'white' : '#d36491' }
                  ]}>
                    {date}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{backgroundColor: '#f9d3d9', flex: 1}}>
      <Text style={styles.title}>Let's know you 🌸</Text>

         {/* <AnimatedDressCarousel /> */}
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingBottom: 50, // Important: Add padding for scroll
          minHeight: '100%'
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.profile} onPress={pickImage}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <Image source={require('../../assets/images/cam.png')} />
          )}
        </TouchableOpacity>

        <Text style={{
          color: '#666',
          fontFamily: 'Raleway-Regular',
          fontSize: responsiveFontSize(16),
          marginTop: 0
        }}>
          Profile Picture (optional)
        </Text>

        <View style={{ width: '100%', alignItems: 'center' }}>
          {/* Name Input */}
          <View style={{ width: '100%', marginTop: 10, borderRadius: 100, alignItems: 'center', justifyContent: 'center' }}>
            <TextInput
              style={styles.input}
              mode="flat"
              label={<Text style={{ color: '#d36491', fontFamily: 'Raleway-Regular' }}>Name</Text>}
              value={name}
              onChangeText={setName}
              activeUnderlineColor='#d36491'
              underlineColor='#d36491'
              outlineColor="#d36491"
              activeOutlineColor="#d36491"
              textColor='#d36491'
              placeholderTextColor="#d36491"
              theme={{
                roundness: 20,
                colors: {
                  primary: '#d36491',
                  placeholder: '#d36491',
                  text: '#d36491',
                },
                fonts: {
                  regular: { fontFamily: 'Raleway-Regular' },
                },
              }}
            />
          </View>

          {/* Mood Selection */}
          <Text style={{
            color: '#666',
            fontFamily: 'Raleway-Bold',
            fontSize: responsiveFontSize(16),
            marginTop: 30,
            marginHorizontal: '10%',
            alignSelf: 'flex-start'
          }}>
            Mood Today
          </Text>

          <View style={{
            width: '100%',
            marginTop: 10,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {moodOptions.map((item, index) => {
              const isSelected = selectedMood === item.label;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedMood(item.label)}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 6,
                    marginVertical: 6,
                    borderWidth: 2,
                    borderColor: '#d36491',
                    backgroundColor: isSelected ? '#d36491' : 'white'
                  }}
                >
                  <Text style={{
                    color: isSelected ? 'white' : '#d36491',
                    fontFamily: 'Raleway-Regular',
                    fontSize: responsiveFontSize(16)
                  }}>
                    {item.emoji}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Washcycle Selection */}
          <Text style={styles.sectionTitle}>Wash Cycle Preference</Text>
          <View style={styles.washcycleContainer}>
            {washcycleOptions.map((item, index) => {
              const isSelected = selectedWashcycle === item.label;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedWashcycle(item.label);
                    setWashDay(null);
                    setWashDate(null);
                    setCustomDays(3);
                  }}
                  style={[styles.washcycleOption, {
                    backgroundColor: isSelected ? '#f9d3d9' : 'white'
                  }]}
                >
                  {/* <Text style={[styles.washcycleEmoji, {
                    color: isSelected ? 'white' : '#d36491'
                  }]}>
                    {item.emoji}
                  </Text> */}
                  <Image source={item.uri} style={{height: 28, width: 28}} />
                  <Text style={[styles.washcycleLabel, {
                    color:  '#d36491'
                  }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Washcycle Details */}
          {renderWashcycleDetails()}

          {/* Continue Button */}
          <TouchableOpacity
            disabled={!isNameValid || !isWashcycleComplete()}
            onPress={async () => {
              try {
                const washcycleData = {
                  type: selectedWashcycle,
                  washDay: washDay,
                  washDate: washDate,
                  customDays: customDays
                };

                await AsyncStorage.multiSet([
                  ['name', name ? name : 'User'],
                  ['mood', selectedMood ? selectedMood : 'Neutral'],
                  ['washcycle', JSON.stringify(washcycleData)],
                  ['profileImage', profileImage || 'https://img.icons8.com/?size=256w&id=23308&format=png']
                ]);
                // router.navigate('/permission2')
                navigation.navigate('permission2');

              } catch(e) {
                //console.log("this is error", e);
              }
            }}
            style={[styles.button, {
              marginTop: 30,
              opacity: (isNameValid && isWashcycleComplete()) ? 1 : 0.5
            }]}
          >
            <Surface elevation={3} style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent'
            }}>
              <Text style={{
                color: 'white',
                fontFamily: 'Raleway-SemiBold',
                fontSize: responsiveFontSize(18),
                alignSelf: 'center'
              }}>
                Continue 
              </Text>
              <Image source={require('../../assets/images/ai.png')} style={{ width: 20, height: 18, marginLeft: 10 }} />
            </Surface>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Permission;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    width: '100%',
    marginTop: responsiveHeight(0),
    borderTopRightRadius: 190,
    borderTopLeftRadius: 190,
    flex: 1, // Important for proper scroll
    zIndex: 10
  },
  title: {
    fontSize: responsiveFontSize(28),
    color: '#d36491',
    marginBottom: responsiveHeight(4),
    fontFamily: 'Raleway-Bold',
    marginTop: responsiveHeight(4),
    alignSelf: 'center'
  },
  profile: {
    backgroundColor: '#fff',
    height: responsiveHeight(15),
    width: responsiveHeight(15),
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d36491',
    // position: "absolute",
    // top:30,
    zIndex: 999,
    marginTop: 10


  },
  input: {
    width: '80%',
    marginTop: 10,
    color: '#d36491',
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#d36491',
    width: '85%',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  washcycleContainer: {
    width: '90%',
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  washcycleOption: {
    height: 60,
    width: '28%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#d36491',
  },
  washcycleEmoji: {
    fontSize: responsiveFontSize(20),
    marginBottom: 5
  },
  washcycleLabel: {
    fontFamily: 'Raleway-Regular',
    fontSize: responsiveFontSize(12)
  },
  dayOption: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: '#d36491',
  },
  dayText: {
    fontFamily: 'Raleway-Regular',
    fontSize: responsiveFontSize(12)
  },
  dateScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  dateOption: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#d36491',
  },
  dateText: {
    fontFamily: 'Raleway-Regular',
    fontSize: responsiveFontSize(12)
  },
  sectionTitle: {
    color: '#666',
    fontFamily: 'Raleway-Bold',
    fontSize: responsiveFontSize(16),
    marginTop: 20,
    marginHorizontal: '10%',
    alignSelf: 'flex-start'
  },
  optionsContainer: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
});