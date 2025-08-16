import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
// useColorScheme ko remove karo - use nahi kar rahe

// Screens import
import Onboarding from '../screens/onboarding';
import Permission from '../screens/permission';
import permission2 from '../screens/permission2';
import TabNavigator from '../screens/Tabs/tabNavigator';
import ScanningScreen from '../screens/scanning';
import ManualAdd from '../screens/addManually';

const Stack = createNativeStackNavigator();

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
    text: '#000000',
    card: '#ffffff',
    border: '#e1e1e1',
    notification: '#ff3b30',
    primary: '#007AFF',
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={MyLightTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' } // Force white background for all screens
        }}
      >
        <Stack.Screen name="onboarding" component={Onboarding} />
        <Stack.Screen name="permission" component={Permission} />
        <Stack.Screen name="permission2" component={permission2} />
        <Stack.Screen name="tabs" component={TabNavigator} />
        <Stack.Screen name="scanning" component={ScanningScreen} />
        <Stack.Screen name="addManually" component={ManualAdd} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}