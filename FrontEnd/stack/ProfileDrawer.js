import React from 'react';
import {useSelector} from 'react-redux';
import {createDrawerNavigator} from '@react-navigation/drawer';

import ProfileScreen from '../screens/profile/ProfileScreen';
import ProfileEditScreen from '../screens/profile/ProfileEditScreen';
import AppSettings from '../screens/profile/AppSettings';
import AppInfo from '../screens/profile/AppInfo';
import ServiceTermsScreen from '../screens/profile/ServiceTermsScreen';

const Drawer = createDrawerNavigator();

const ProfileDrawer = () => {
  const nickname = useSelector(state => state.accounts.currentUser.nickname);
  return (
    <Drawer.Navigator
      initialRouteName="메인 프로필"
      detachInactiveScreens={false}
      screenOptions={{
        drawerPosition: 'right',
        headerShown: false,
        drawerStyle: {
          // backgroundColor: 'black',
          width: 150,
        },
      }}>
      <Drawer.Screen
        name="메인프로필"
        component={ProfileScreen}
        options={{
          drawerItemStyle: {display: 'none'},
        }}
        style={{display: 'none'}}
        initialParams={{
          initial: true,
          nickname,
        }}
      />
      <Drawer.Screen name="프로필 설정" component={ProfileEditScreen} />
      <Drawer.Screen name="앱 설정" component={AppSettings} />
      <Drawer.Screen name="앱 정보" component={AppInfoStack} />
    </Drawer.Navigator>
  );
};

import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();

function AppInfoStack() {
  return (
    <Stack.Navigator
      initialRouteName="앱 정보"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="앱 정보" component={AppInfo} />
      <Stack.Screen name="이용약관" component={ServiceTermsScreen} />
    </Stack.Navigator>
  );
}

export default ProfileDrawer;
