import 'react-native-gesture-handler';

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

import React, {useState, useEffect} from 'react';

import {PermissionsAndroid, Linking} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import InitialScreen from './InitialScreen';

import MainScreen from './MainScreen';
import LoginScreen from './accounts/LoginScreen';
import SignupStack from '../stack/SignupStack';

import HomeStack from '../stack/HomeStack';
import SearchStack from '../stack/SearchStack';

import StoreStack from '../stack/StoreStack';
import ReelsStack from '../stack/ReelsStack';
import ProfileStack from '../stack/ProfileStack';

import MapIcon from '../assets/image/tab/map.svg';
import ReelsIcon from '../assets/image/tab/reels.svg';
import HomeIcon from '../assets/image/tab/home.svg';
import SearchIcon from '../assets/image/tab/search.svg';
import ProfileIcon from '../assets/image/tab/profile.svg';
import ActiveMapIcon from '../assets/image/tab/activeMap.svg';
import ActiveReelsIcon from '../assets/image/tab/activeReels.svg';
import ActiveHomeIcon from '../assets/image/tab/activeHome.svg';
import ActiveSearchIcon from '../assets/image/tab/activeSearch.svg';
import ActiveProfileIcon from '../assets/image/tab/activeProfile.svg';

import {
  getCurrentUser,
  removeAccessToken,
  removeCurrentUser,
  removeRefreshToken,
} from '../utils/Token';
import {fetchCurrentUser} from '../utils/slices/AccountsSlice';
import {fetchCenterInfo} from '../utils/slices/CenterSlice';
import {
  StartPer,
  AsyncAlert,
  checkMultiplePermissions,
} from '../utils/permissions.js';

import {handleInitialFCM} from '../utils/fcm/fcmGetToken';
import {changeNewNoti} from '../utils/slices/notificationSlice';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function YoungClimb() {
  const dispatch = useDispatch();
  const [loading, setIsLoading] = useState(true);
  const login = useSelector(state => state.accounts.loginState);

  useEffect(() => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      await AsyncStorage.setItem('newNoti', 'true');
      dispatch(changeNewNoti(true));
      return remoteMessage;
    });

    // AsyncStorage.removeItem('notiSet')
    const permissionList = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      // PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      // PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ];
    const permissionDict = {
      'android.permission.CAMERA': '?????????',
      'android.permission.ACCESS_FINE_LOCATION': '??????',
      'android.permission.READ_EXTERNAL_STORAGE': '????????????',
    };
    const neverCallList = [];
    const callRes = async () => {
      try {
        const result = await checkMultiplePermissions(permissionList);
        const current = await AsyncStorage.getItem('currentUser');
        if (!current && !result) {
          await AsyncAlert(
            'Young Climb ??? ?????? ??????',
            '????????? Young Climb ??? ????????? ?????? ????????? ????????? ??????????????????',
            async () => {
              try {
                for (const per of permissionList) {
                  const result = await StartPer(per);
                  if (result === per) {
                    neverCallList.push(per);
                  }
                }
              } catch (err) {
                console.log(err);
              }
            },
          );
        }
        if (neverCallList.length) {
          let txt = '';
          neverCallList.forEach(content => {
            txt += permissionDict[content] + '\n';
          });
          AsyncAlert(
            '?????? ?????? ????????? ??????',
            '????????? ?????? ????????? ???????????? ???????????? ?????? ?????? ??? ??? ??????????????????. \n \n' +
              txt,
            Linking.openSettings,
          );
        }
      } catch (err) {
        console.log(err);
      }
    };
    callRes();
    handleInitialFCM();

    // AsyncStorage.getItem('currentUser').then((res)=>{
    //   if (!res) {
    //     // ????????? ???????????? ?????? ????????? fcmToken ???????????? async??? ??????
    //   } else {
    //     onRefreshFCMToken();
    //     AsyncStorage.getItem('notiSet').then((res)=>{
    //       const now = new Date(); // ?????? ??????
    //       const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // ?????? ????????? utc??? ????????? ??????????????????
    //       const koreaTimeDiff = 9 * 60 * 60 * 1000; // ?????? ????????? UTC?????? 9?????? ??????(9????????? ??????????????? ??????)
    //       const koreaNow = new Date(9 * 60 * 60 * 1000)
    //       if (!res){
    //         Alert.alert(                    // ???????????? Alert??? ?????????
    //         "????????? ?????? ?????? ??????",                    // ????????? text: ????????? ??????
    //         "Young Climb ??????(?????????, ??????, ?????????) \n????????? ?????? ?????? ??????????????????",                         // ????????? text: ??? ?????? ?????? ??????
    //         [                              // ?????? ??????
    //           {
    //             text: "???????????? ??????",                              // ?????? ??????
    //             onPress: async() => {
    //               axiosTemp.post(api.fcmtokendelete(),await getConfig()).then((res)=>{console.log(res)}).catch((err)=>{console.log(err)})
    //               await AsyncStorage.setItem('notiSet', JSON.stringify(koreaNow))},     //onPress ???????????? ???????????? ????????? ?????????
    //             style: "cancel"
    //           },
    //           { text: "??????", onPress: async() => {
    //             await AsyncStorage.setItem('notiSet', JSON.stringify(koreaNow))
    //             await AsyncStorage.setItem('notiAllow', JSON.stringify('true'))
    //             const fcmToken = await AsyncStorage.getItem('fcmToken')
    //             const fcm = fcmToken.replace('"','').replace('"','')
    //             axiosTemp.post(api.fcmtokensave(), {fcmToken:fcm}, await getConfig()).then((res)=>{console.log(res)})
    //           }},
    //         ],
    //         { cancelable: false })
    //       }

    //     })
    //     }

    // })
  }, []);

  useEffect(() => {
    dispatch(fetchCenterInfo());

    getCurrentUser().then(res => {
      if (res) {
        dispatch(fetchCurrentUser(res));
      } else {
        removeAccessToken();
        removeRefreshToken();
        removeCurrentUser();
      }
    });

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }, [dispatch]);

  return (
    <>
      {loading ? (
        <InitialScreen />
      ) : (
        <NavigationContainer>
          {login ? (
            <Tab.Navigator
              initialRouteName="??????"
              screenOptions={{
                tabBarShowLabel: false,
                tabBarActiveTintColor: 'black',
                headerShown: false,
              }}>
              <Tab.Screen
                name="??????"
                component={StoreStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveMapIcon /> : <MapIcon />,
                }}
              />
              <Tab.Screen
                name="?????????"
                component={ReelsStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveReelsIcon /> : <ReelsIcon />,
                }}
              />
              <Tab.Screen
                name="??????"
                component={HomeStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveHomeIcon /> : <HomeIcon />,
                }}
              />
              <Tab.Screen
                name="?????????"
                component={SearchStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveSearchIcon /> : <SearchIcon />,
                }}
              />
              <Tab.Screen
                name="????????????"
                component={ProfileStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveProfileIcon /> : <ProfileIcon />,
                }}
              />
            </Tab.Navigator>
          ) : (
            <Stack.Navigator
              initialRouteName="??????"
              screenOptions={{headerShown: false}}>
              <Stack.Screen name="??????" component={MainScreen} />
              <Stack.Screen name="?????????" component={LoginScreen} />
              <Stack.Screen name="????????????" component={SignupStack} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      )}
    </>
  );
}
