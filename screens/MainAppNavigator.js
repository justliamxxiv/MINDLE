import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

// Student screens
import HomeScreen from './HomeScreen';
import GroupsScreen from './GroupsScreen';
import TutorsScreen from './TutorsScreen';
import ProfileScreen from './ProfileScreen';
import RequestSessionScreen from './RequestSessionScreen';

// Tutor screens
import TutorHomeScreen from './TutorHomeScreen';
import TutorStudentsScreen from './TutorStudentsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_BAR_STYLE = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#F5F5F5',
  paddingBottom: 20,
  paddingTop: 8,
  height: 75,
};

function tabIcon(routeName, focused, color, size) {
  const icons = {
    Home:     focused ? 'home'          : 'home-outline',
    Groups:   focused ? 'people'        : 'people-outline',
    Tutors:   focused ? 'school'        : 'school-outline',
    Students: focused ? 'person'        : 'person-outline',
    Profile:  focused ? 'person-circle' : 'person-circle-outline',
  };
  return <Ionicons name={icons[routeName] || 'ellipse'} size={size} color={color} />;
}

const TAB_SCREEN_OPTIONS = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: '#FF3131',
  tabBarInactiveTintColor: '#666666',
  tabBarStyle: TAB_BAR_STYLE,
  tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
  tabBarIcon: ({ focused, color, size }) => tabIcon(route.name, focused, color, size),
});

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Tutors" component={TutorsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function TutorTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_SCREEN_OPTIONS}>
      <Tab.Screen name="Home" component={TutorHomeScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Students" component={TutorStudentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Wrap each role's tabs in a stack so screens like RequestSession can push on top
function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="RequestSession" component={RequestSessionScreen} />
    </Stack.Navigator>
  );
}

function TutorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TutorTabs" component={TutorTabs} />
    </Stack.Navigator>
  );
}

export default function MainAppNavigator() {
  const { userData } = useUser();
  return userData?.accountType === 'tutor' ? <TutorStack /> : <StudentStack />;
}
