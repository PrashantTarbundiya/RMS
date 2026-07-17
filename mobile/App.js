import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, paperTheme, navigationTheme, FONT_SIZES, BORDER_RADIUS } from './src/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import RecognizeScreen from './src/screens/RecognizeScreen';
import AddPersonScreen from './src/screens/AddPersonScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ManagePersonScreen from './src/screens/ManagePersonScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { focused: 'view-dashboard', unfocused: 'view-dashboard-outline' },
  Recognize: { focused: 'camera-iris', unfocused: 'camera-outline' },
  AddPerson: { focused: 'account-plus', unfocused: 'account-plus-outline' },
  Models: { focused: 'cube-scan', unfocused: 'cube-outline' },
  Settings: { focused: 'tune-vertical-variant', unfocused: 'tune-vertical' },
  Support: { focused: 'help-rhombus', unfocused: 'help-rhombus-outline' },
};

function TabIcon({ routeName, focused }) {
  const tabConfig = TAB_ICONS[routeName] || { focused: 'circle', unfocused: 'circle-outline' };
  const iconName = focused ? tabConfig.focused : tabConfig.unfocused;

  return (
    <View style={styles.tabIconWrapper}>
      {focused && (
        <View style={styles.appleLiquidSelectionCapsule} />
      )}
      <MaterialCommunityIcons
        name={iconName}
        size={focused ? 22 : 20}
        color={focused ? '#FFFFFF' : COLORS.textTertiary}
      />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderBottomColor: 'rgba(255, 255, 255, 0.10)',
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: '700',
          fontSize: FONT_SIZES.md,
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 12),
          left: 20,
          right: 20,
          backgroundColor: 'rgba(24, 26, 42, 0.75)',
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.18)',
          borderTopColor: 'rgba(255, 255, 255, 0.42)',
          borderLeftColor: 'rgba(255, 255, 255, 0.22)',
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
        },
        tabBarActiveTintColor: COLORS.appleBlue,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          headerTitle: 'RMS Face AI',
        }}
      />
      <Tab.Screen
        name="Recognize"
        component={RecognizeScreen}
        options={{
          title: 'Scan',
          headerTitle: 'Face Scanner',
        }}
      />
      <Tab.Screen
        name="AddPerson"
        component={AddPersonScreen}
        options={{
          title: 'Add',
          headerTitle: 'Add Subject',
        }}
      />
      <Tab.Screen
        name="Models"
        component={ModelsScreen}
        options={{
          title: 'Models',
          headerTitle: 'AI Models',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
      <Tab.Screen
        name="Support"
        component={SupportScreen}
        options={{
          title: 'Help',
          headerTitle: 'Help & Guide',
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ManagePerson"
        component={ManagePersonScreen}
        options={{
          title: 'Manage',
          headerTitle: 'Subject Profile',
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <MainTabs />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 28,
  },
  appleLiquidSelectionCapsule: {
    position: 'absolute',
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
