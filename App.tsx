import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './redux/store/store';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  useEffect(() => {
    // Force light theme on app start
    StatusBar.setBarStyle('dark-content', true);
    StatusBar.setBackgroundColor('#ffffff', true);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
        
      />
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Force white background
  },
});

export default App;