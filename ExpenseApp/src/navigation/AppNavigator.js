import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomeScreen from '../screens/IncomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ReportsScreen from '../screens/ReportsScreen';
import StatementScreen from '../screens/StatementScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard',    icon: 'home',         iconOff: 'home-outline',         component: DashboardScreen },
  { name: 'Transactions', icon: 'list',          iconOff: 'list-outline',          component: TransactionsScreen },
  { name: 'Expenses',     icon: 'card',          iconOff: 'card-outline',          component: ExpensesScreen },
  { name: 'Income',       icon: 'cash',          iconOff: 'cash-outline',          component: IncomeScreen },
  { name: 'Budget',       icon: 'pie-chart',     iconOff: 'pie-chart-outline',     component: BudgetScreen },
  { name: 'Reports',      icon: 'bar-chart',     iconOff: 'bar-chart-outline',     component: ReportsScreen },
  { name: 'Statement',    icon: 'document-text', iconOff: 'document-text-outline', component: StatementScreen },
];

export default function AppNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name) || {};
        return {
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? tab.icon : tab.iconOff} size={size} color={color} />
          ),
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#6C63FF',
          tabBarInactiveTintColor: '#bbb',
          tabBarStyle: { height: 56 },
          headerStyle: { backgroundColor: '#6C63FF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        };
      }}>
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
          tabBarShowLabel: false,
        }}>
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
