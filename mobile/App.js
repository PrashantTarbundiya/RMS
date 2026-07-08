import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { COLORS } from './src/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import RecognizeScreen from './src/screens/RecognizeScreen';
import AddPersonScreen from './src/screens/AddPersonScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.bgPrimary,
    card: COLORS.bgSecondary,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};

function TabIcon({ icon, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>
      {icon}
    </Text>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" backgroundColor={COLORS.bgPrimary} />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.bgSecondary,
            borderBottomColor: COLORS.border,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontWeight: '700',
            fontSize: 16,
          },
          tabBarStyle: {
            backgroundColor: COLORS.bgSecondary,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            // Adjust height to completely avoid native indicator button overlays
            height: Platform.OS === 'ios' ? 88 : 72,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 8,
            elevation: 0,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            headerTitle: 'RMS Face AI - Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📊" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Recognize"
          component={RecognizeScreen}
          options={{
            title: 'Scan',
            headerTitle: 'Inference Face Scan',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📷" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="AddPerson"
          component={AddPersonScreen}
          options={{
            title: 'Register',
            headerTitle: 'Register New Person',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="➕" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Models"
          component={ModelsScreen}
          options={{
            title: 'Models',
            headerTitle: 'Model Files & Export',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📦" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerTitle: 'Connection Settings',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⚙️" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Support"
          component={SupportScreen}
          options={{
            title: 'Help',
            headerTitle: 'Help & Documentation',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="❓" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
