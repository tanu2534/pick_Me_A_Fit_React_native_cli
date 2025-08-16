// src/screens/Onboarding.js
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Surface } from 'react-native-paper';
import { responsiveFontSize } from '../utility/responsive';

const Onboarding = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ref = useRef(null);
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem('name');
      //console.log(storedUser);
      if (storedUser) {
        navigation.replace('tabs'); // CLI navigation
        setUser(storedUser);
      } else {
        await AsyncStorage.clear();
      }
    })();
  }, []);

  const updateCurrentSlideIndex = e => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const slides = [
    {
      title: 'Get Styled Everyday',
      description:
        'Receive personalized outfit suggestions tailored to your mood, occasion, or even the weather — so you always step out in style.',
      image: require('../../assets/images/dress.png'),
    },
    {
      title: 'Your Wardrobe, Organized',
      description:
        'Easily build your digital closet, categorize outfits, and keep everything you own right at your fingertips — anytime, anywhere.',
      image: require('../../assets/images/ward.png'),
    },
    {
      title: 'Auto-Detect Your Outfits (coming soon)',
      description:
        'Let the app magically scan your phone gallery to identify your clothes — no more wasting time on manual uploads.',
      image: require('../../assets/images/hanger.png'),
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Image source={require('../../assets/images/bow.png')} style={{ width: 50, height: 50 }} />
        <Text style={[styles.title, {
          color: '#d36491',
          fontFamily: 'concertOne',
          fontSize: responsiveFontSize(40),
          marginBottom: 0,
          textAlign: 'center'
        }]}>
          Pick me a fit
        </Text>
        <Text style={[styles.description, {
          color: '#666',
          fontFamily: 'Raleway-Regular',
          lineHeight: 25,
          height: 20,
          marginTop: 0
        }]}>
          Discover the perfect outfits for you
        </Text>
      </View>

      <FlatList
        style={{ marginTop: 35, maxHeight: 350, width: '100%' }}
        ref={ref}
        data={slides}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        renderItem={({ item }) => (
          <Surface elevation={3} style={{
            width: width * 0.8,
            alignItems: 'center',
            padding: 20,
            backgroundColor: '#fff',
            height: 300,
            marginHorizontal: width * 0.1,
            marginTop: 10,
            borderRadius: 20,
            paddingTop: 40
          }}>
            <Image source={item.image} style={{ width: 50, height: 50, marginBottom: 10 }} />
            <Text style={[styles.title, {
              color: '#d36491',
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: 'Raleway-SemiBold'
            }]}>
              {item.title}
            </Text>
            <Text style={[styles.description, {
              color: '#666',
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: 'Raleway-Regular'
            }]}>
              {item.description}
            </Text>
          </Surface>
        )}
      />

      {/* three sliding dots */}
      <View style={styles.flat}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlideIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          if (user) {
            navigation.replace('tabs');
          } else {
            navigation.navigate('permission');
          }
        }}
        style={styles.button}
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
            Get Started
          </Text>
          <Image source={require('../../assets/images/heart.png')} style={{ width: 20, height: 18, marginLeft: 10 }} />
        </Surface>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
    height: '100%',
    width: '100%'
  },
  title: {
    fontSize: responsiveFontSize(24),
    color: '#023c69',
    marginBottom: 10,
    fontFamily: 'Raleway-SemiBold'
  },
  description: {
    fontSize: responsiveFontSize(16),
    textAlign: 'center',
    fontFamily: 'Raleway-Regular',
    alignSelf: 'flex-start'
  },
  button: {
    backgroundColor: '#d36491',
    width: '80%',
    padding: 15,
    borderRadius: 50,
    marginBottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flat: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#d36491',
  },
});
