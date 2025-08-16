import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const SplashScreen = ({ progress = 0.5 }) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image 
        source={require('../assets/images/logo.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      
      {/* Loading / progress indicator */}
      <ActivityIndicator size="large" color="#FF69B4" style={{ marginTop: 20 }} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Splash bg
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  text: {
    marginTop: 15,
    fontSize: 18,
    color: '#555',
  },
});
