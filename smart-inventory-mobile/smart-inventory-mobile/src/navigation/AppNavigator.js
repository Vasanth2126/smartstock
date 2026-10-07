import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, font, radius, spacing } from '../utils/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import POSScreen from '../screens/POSScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AIForecastScreen from '../screens/AIForecastScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import SuperAdminScreen from '../screens/SuperAdminScreen';
import {
  AlertsScreen,
  SuppliersScreen,
  ReportsScreen,
} from '../screens/OtherScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard:     '⚡',
  POS:           '🧾',
  'AI Demand':   '✨',
  Products:      '📦',
  Reports:       '📊',
  Suppliers:     '🚚',
  Alerts:        '🔔',
  Staff:         '👥',
  'Shops & Sales': '🏪',
  'Platform Users': '👥',
};

function CustomHeaderTitle({ title, user, onLogout }) {
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: spacing.md }}>
      <View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.heavy }}>
          {title}
        </Text>
        <Text style={{ color: colors.text3, fontSize: 11 }}>
          {isSuperAdmin ? '👑 Super Admin Control' : (user?.shopName || 'SmartStock POS')}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert('Sign Out', 'Do you want to log out of your account?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: onLogout },
          ]);
        }}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.sm,
          backgroundColor: colors.bg3,
          borderWidth: 1,
          borderColor: colors.border2,
        }}
      >
        <Text style={{ color: colors.redLight, fontSize: 11, fontWeight: font.bold }}>Sign Out ⎋</Text>
      </TouchableOpacity>
    </View>
  );
}

const SuperAdminShopsTab = (props) => <SuperAdminScreen {...props} initialTab="shops" />;
const SuperAdminUsersTab = (props) => <SuperAdminScreen {...props} initialTab="users" />;

// ── Super Admin Dedicated Navigator ──────────────────────────────────────────
function SuperAdminTabs() {
  const { user, logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 30,
            borderRadius: radius.sm,
            backgroundColor: focused ? colors.purpleBg : 'transparent',
          }}>
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name] || '👑'}
            </Text>
          </View>
        ),
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              fontSize: 11,
              color: focused ? colors.purpleLight : colors.text3,
              fontWeight: focused ? font.heavy : font.medium,
            }}
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          height: 62,
        },
        tabBarActiveTintColor: colors.purpleLight,
        tabBarInactiveTintColor: colors.text3,
        headerStyle: {
          backgroundColor: colors.bg2,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: () => (
          <CustomHeaderTitle title={route.name} user={user} onLogout={logout} />
        ),
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Shops & Sales"
        component={SuperAdminShopsTab}
        options={{ tabBarLabel: 'Shops & Sales' }}
      />
      <Tab.Screen
        name="Platform Users"
        component={SuperAdminUsersTab}
        options={{ tabBarLabel: 'Users & Access' }}
      />
    </Tab.Navigator>
  );
}

// ── Shop Owner & Staff Navigator ─────────────────────────────────────────────
function StoreTabs() {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 28,
            borderRadius: radius.sm,
            backgroundColor: focused ? colors.accentBg : 'transparent',
          }}>
            <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name] || '📱'}
            </Text>
          </View>
        ),
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              fontSize: 10,
              color: focused ? colors.accentLight : colors.text3,
              fontWeight: focused ? font.heavy : font.medium,
            }}
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          height: 62,
        },
        tabBarActiveTintColor: colors.accentLight,
        tabBarInactiveTintColor: colors.text3,
        headerStyle: {
          backgroundColor: colors.bg2,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: () => (
          <CustomHeaderTitle title={route.name} user={user} onLogout={logout} />
        ),
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="POS" component={POSScreen} options={{ tabBarLabel: 'POS' }} />
      <Tab.Screen name="AI Demand" component={AIForecastScreen} options={{ tabBarLabel: 'AI Demand' }} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      
      {/* Role-Protected Modules for Shop Owner */}
      {isOwner && (
        <>
          <Tab.Screen name="Reports" component={ReportsScreen} />
          <Tab.Screen name="Suppliers" component={SuppliersScreen} />
          <Tab.Screen name="Staff" component={StaffManagementScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: isSuperAdmin ? colors.purple : colors.accent,
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
          <Stack.Screen
            name="Main"
            component={isSuperAdmin ? SuperAdminTabs : StoreTabs}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}