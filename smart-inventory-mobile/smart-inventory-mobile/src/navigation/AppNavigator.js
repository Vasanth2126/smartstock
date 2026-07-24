import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, font } from '../utils/theme';

import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import POSScreen      from '../screens/POSScreen';
import ProductsScreen from '../screens/ProductsScreen';
import { AlertsScreen, SuppliersScreen, ReportsScreen } from '../screens/OtherScreens';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '⬛',
  Billing:   '🧾',
  Products:  '📦',
  Alerts:    '🔔',
  Suppliers: '🚚',
  Reports:   '📊',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name]}</Text>
        ),
        tabBarLabel: ({ focused, children }) => (
          <Text style={{ fontSize: 10, color: focused ? colors.accent : colors.text2, fontWeight: focused ? font.semibold : font.regular }}>{children}</Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text2,
        headerStyle: { backgroundColor: colors.bg2 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: font.semibold, fontSize: 16 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Billing"   component={POSScreen} options={{ headerTitle: 'Billing (POS)' }} />
      <Tab.Screen name="Products"  component={ProductsScreen} />
      <Tab.Screen name="Alerts"    component={AlertsScreen} />
      <Tab.Screen name="Suppliers" component={SuppliersScreen} />
      <Tab.Screen name="Reports"   component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.bg2,
          text: colors.text,
          border: colors.border,
          notification: colors.red,
        },
      }}
    >
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
