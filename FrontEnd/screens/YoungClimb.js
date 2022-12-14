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
      'android.permission.CAMERA': '카메라',
      'android.permission.ACCESS_FINE_LOCATION': '위치',
      'android.permission.READ_EXTERNAL_STORAGE': '저장공간',
    };
    const neverCallList = [];
    const callRes = async () => {
      try {
        const result = await checkMultiplePermissions(permissionList);
        const current = await AsyncStorage.getItem('currentUser');
        if (!current && !result) {
          await AsyncAlert(
            'Young Climb 앱 권한 설정',
            '원활한 Young Climb 앱 사용을 위해 다음의 권한을 허용해주세요',
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
            '권한 요청 거부된 요청',
            '다음의 권한 요청이 거부되어 설정에서 권한 설정 후 앱 사용바랍니다. \n \n' +
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
    //     // 로그인 되어있지 않은 상태면 fcmToken 받아와서 async에 저장
    //   } else {
    //     onRefreshFCMToken();
    //     AsyncStorage.getItem('notiSet').then((res)=>{
    //       const now = new Date(); // 현재 시간
    //       const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // 현재 시간을 utc로 변환한 밀리세컨드값
    //       const koreaTimeDiff = 9 * 60 * 60 * 1000; // 한국 시간은 UTC보다 9시간 빠름(9시간의 밀리세컨드 표현)
    //       const koreaNow = new Date(9 * 60 * 60 * 1000)
    //       if (!res){
    //         Alert.alert(                    // 말그대로 Alert를 띄운다
    //         "서비스 푸시 알림 동의",                    // 첫번째 text: 타이틀 제목
    //         "Young Climb 활동(팔로우, 댓글, 좋아요) \n알림을 받기 위해 동의해주세요",                         // 두번째 text: 그 밑에 작은 제목
    //         [                              // 버튼 배열
    //           {
    //             text: "동의하지 않음",                              // 버튼 제목
    //             onPress: async() => {
    //               axiosTemp.post(api.fcmtokendelete(),await getConfig()).then((res)=>{console.log(res)}).catch((err)=>{console.log(err)})
    //               await AsyncStorage.setItem('notiSet', JSON.stringify(koreaNow))},     //onPress 이벤트시 콘솔창에 로그를 찍는다
    //             style: "cancel"
    //           },
    //           { text: "동의", onPress: async() => {
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
              initialRouteName="홈탭"
              screenOptions={{
                tabBarShowLabel: false,
                tabBarActiveTintColor: 'black',
                headerShown: false,
              }}>
              <Tab.Screen
                name="지점"
                component={StoreStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveMapIcon /> : <MapIcon />,
                }}
              />
              <Tab.Screen
                name="릴스탭"
                component={ReelsStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveReelsIcon /> : <ReelsIcon />,
                }}
              />
              <Tab.Screen
                name="홈탭"
                component={HomeStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveHomeIcon /> : <HomeIcon />,
                }}
              />
              <Tab.Screen
                name="검색탭"
                component={SearchStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveSearchIcon /> : <SearchIcon />,
                }}
              />
              <Tab.Screen
                name="프로필탭"
                component={ProfileStack}
                options={{
                  tabBarIcon: ({focused}) =>
                    focused ? <ActiveProfileIcon /> : <ProfileIcon />,
                }}
              />
            </Tab.Navigator>
          ) : (
            <Stack.Navigator
              initialRouteName="메인"
              screenOptions={{headerShown: false}}>
              <Stack.Screen name="메인" component={MainScreen} />
              <Stack.Screen name="로그인" component={LoginScreen} />
              <Stack.Screen name="회원가입" component={SignupStack} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      )}
    </>
  );
}
