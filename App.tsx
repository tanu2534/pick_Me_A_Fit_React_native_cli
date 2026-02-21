import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './redux/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import RNBootSplash from 'react-native-bootsplash';
import { Colors } from './src/constants/Colors';

function App() {
  useEffect(() => {
    // Force light theme on app start
    StatusBar.setBarStyle('dark-content', true);
    StatusBar.setBackgroundColor(Colors.cream, true);

    // Hide bootsplash after app is ready
    const init = async () => {
      // Thoda delay bhi de sakte ho if needed
      await new Promise(resolve => setTimeout(resolve, 500));
      RNBootSplash.hide({ fade: true });
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Colors.cream}
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
