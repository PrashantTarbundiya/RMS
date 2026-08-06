import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, paperTheme, navigationTheme, FONT_SIZES, BORDER_RADIUS } from './src/theme';

LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Animated: `useNativeDriver` is not supported',
  'shadow* style props are deprecated',
]);

import DashboardScreen from './src/screens/DashboardScreen';
import RecognizeScreen from './src/screens/RecognizeScreen';
import AddPersonScreen from './src/screens/AddPersonScreen';
import ModelsScreen from './src/screens/ModelsScreen';
import ManagePersonScreen from './src/screens/ManagePersonScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import CameraCaptureScreen from './src/screens/CameraCaptureScreen';
import LoginScreen from './src/screens/LoginScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        <View style={styles.tabActiveGlow} />
      )}
      <MaterialCommunityIcons
        name={iconName}
        size={22}
        color={focused ? COLORS.appleBlue : COLORS.textSecondary}
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
          backgroundColor: COLORS.bgPrimary,
          borderBottomColor: COLORS.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: '600',
          fontSize: FONT_SIZES.md,
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, 12),
          left: 16,
          right: 16,
          backgroundColor: 'rgba(15, 16, 17, 0.75)',
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: COLORS.appleBlue,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
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

function AppContent() {
  const { isAuthenticated, isMultiTenant, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <StatusBar style="light" />
      </View>
    );
  }

  // Determine if we need to show the login screen
  const requireLogin = isMultiTenant === true && !isAuthenticated;

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {requireLogin ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Root" component={MainTabs} />
            <Stack.Screen 
              name="CameraCapture" 
              component={CameraCaptureScreen} 
              options={{ presentation: 'fullScreenModal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
    position: 'relative',
  },
  tabActiveGlow: {
    position: 'absolute',
    width: 36,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 106, 210, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(94, 106, 210, 0.35)',
  },
});
