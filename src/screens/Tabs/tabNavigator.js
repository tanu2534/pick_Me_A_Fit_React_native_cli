// src/navigation/TabNavigator.js
import React from 'react';
import { Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Home from '../../screens/index'
import WardrobeScreen from '../../screens/explore';
import PlannerScreen from '../../screens/planner';
import { Colors } from '../../constants/Colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <Tab.Navigator
        
        screenOptions={{
          tabBarActiveTintColor: Colors[ 'light'].tint,
          headerShown: false,
        
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Raleway-Medium',
            fontWeight: '600',
          },
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {
              height: 70,
              width: '95%',
              alignSelf: 'center',
              borderRadius: 20,
              marginBottom: 0,
              
            },
          }),
        }}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="home" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Wardrobe"
          component={WardrobeScreen}
          options={{
            title: 'Wardrobe',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="calendar-alt" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Planner"
          component={PlannerScreen}
          options={{
            title: 'Planner',
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="calendar-alt" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
