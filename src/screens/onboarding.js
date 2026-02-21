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
import { shadow, Surface } from 'react-native-paper';
import { responsiveFontSize } from '../utility/responsive';
import { Colors } from '../constants/Colors';
import { shadows } from '../constants/Shadows';

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
      title: 'Your Wardrobe, Organized',
      description:
        "Catalog your clothes digitally and never lose track of your favorite pieces again.",
      image: require('../../assets/images/ward.png'),
    },
    {
      title: 'Get Styled Everyday',
      description:
        'Stuck on what to wear? Let us mix and match outfits for any occasion.',
      image: require('../../assets/images/dress.png'),
    },
  
    {
      title: 'Auto-Detect Your Outfits (coming soon)',
      description:
        'AI-powered suggestions that learn your style the more you use the app.',
      image: require('../../assets/images/hanger.png'),
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        {/* <Image source={require('../../assets/images/bow.png')} style={{ width: 50, height: 50 }} />
        <Text style={[styles.title, {
          color: '#d36491',
          fontFamily: 'concertOne',
          fontSize: responsiveFontSize(40),
          marginBottom: 0,
          textAlign: 'center'
        }]}>
          Pick me a fit
        </Text> */}
        {/* <Text style={[styles.description, {
          color: '#666',
          fontFamily: 'Raleway-Regular',
          lineHeight: 25,
          height: 20,
          marginTop: 0
        }]}>
          Discover the perfect outfits for you
        </Text> */}
      </View>

      <FlatList
        style={{   paddingTop:'80%'}}
        contentContainerStyle={{ justifyContent:'flex-end',}}
        ref={ref}
        data={slides}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        renderItem={({ item }) => (
          <Surface elevation={0} style={{
            width: width * 0.8,
            alignItems: 'center',
            padding: 20,
            backgroundColor: '#fff',
            height: 300,
            marginHorizontal: width * 0.1,
            marginTop: 10,
            borderRadius: 20,
            paddingTop: 40,
            position:"relative",
            bottom: "0%",
            overflow: 'visible'
          }}>
            <View style={{
              position: 'absolute',
              bottom: '150%',
              width: 180,
              height: 180,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: Colors.cream,
                opacity: 0.15,
              }} />
              <View style={{
                position: 'absolute',
                width: 210,
                height: 210,
                borderRadius: 105,
                backgroundColor: Colors.cream,
                opacity: 0.18,
              }} />
              <View style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: Colors.cream,
                opacity: 0.22,
              }} />
              <View style={{
                position: 'absolute',
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: Colors.cream,
                opacity: 0.26,
              }} />
              <View style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: Colors.cream,
                opacity: 0.3,
              }} />
              <View style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: Colors.cream ,
                opacity: 0.35,
              }} />
              <View style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: Colors.cream,
                opacity: 0.4,
              }} />
              <View style={{
                position: 'absolute',
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: Colors.cream,
                opacity: 0.45,
              }} />
              <View style={{
                position: 'absolute',
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: Colors.cream,
                opacity: 0.5,
              }} />
              <Image source={item.image} style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50,
                zIndex: 10
              }} />
            </View>
            <Text style={[styles.title, {
              color: Colors.brown,
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: 'Raleway-SemiBold',
              fontSize:responsiveFontSize(21)
            }]}>
              {item.title}
            </Text>
            <Text style={[styles.description, {
              color: Colors.brown,
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: 'Raleway-Regular',
              fontSize: responsiveFontSize(14)

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
    width: '100%',
    justifyContent:'flex-end'
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
    backgroundColor: Colors.terra,
    width: '80%',
    padding: 15,
    borderRadius: 50,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: '8%'
  },
  flat: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, 
    position: 'absolute',
    bottom: '15%',
    marginBottom: 50
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.terra,
  },
});
