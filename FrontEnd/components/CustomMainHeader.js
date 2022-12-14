import React, {useRef, useCallback, useEffect} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  Vibration,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import mainLogo from '../assets/image/main/logo.png';
import PostAddIcon from '../assets/image/header/postAddIcon.svg';
import NoticeIcon from '../assets/image/header/noticeIcon.svg';
import NoticeActiveIcon from '../assets/image/header/noticeActiveIcon.svg';

import DropDown from './Dropdown';
import {ToastNotice} from './ToastNotice';
import {useSelector, useDispatch} from 'react-redux';

import {changeNewNoti} from '../utils/slices/notificationSlice';

import messaging from '@react-native-firebase/messaging';

function CustomMainHeader(props) {
  const dispatch = useDispatch();
  const toastNoticeRef = useRef(null);
  const onMsgIncome = useCallback(async remoteMessage => {
    toastNoticeRef.current.show(remoteMessage.notification.body);
    // toastNoticeRef.current=null
  });

  useEffect(() => {
    messaging().onMessage(async remoteMessage => {
      try {
        Vibration.vibrate(500);
        onMsgIncome(remoteMessage);
        await AsyncStorage.setItem('newNoti', 'true');;
        dispatch(changeNewNoti(true));
        return remoteMessage;
      }  catch {
        err => console.log(err);
      ;}
    });
  }, [toastNoticeRef]);

  const newNoti = useSelector(state => state.notification.newNoti);
  return props.type === '홈' ? (
    <View style={styles.container}>
      <ToastNotice ref={toastNoticeRef} />
      <Image style={styles.logoImg} source={mainLogo} />
      <View style={styles.iconGroup}>
        <TouchableOpacity
          style={styles.touchRange}
          onPress={() =>
            props.navigation ? props.navigation.navigate('게시글 생성') : null
          }>
          <PostAddIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.touchRange}
          onPress={() =>
            props.navigation ? props.navigation.navigate('알림') : null
          }>
          {newNoti ? (
            <NoticeActiveIcon style={{marginTop: 2}} />
          ) : (
            <NoticeIcon />
          )}
        </TouchableOpacity>
      </View>
    </View>
  ) : props.type === '프로필' ? (
    <View style={styles.container}>
      <ToastNotice ref={toastNoticeRef} />
      <Text style={styles.headerTitle}>{props.type}</Text>
      <View style={styles.iconGroup}>
        <TouchableOpacity
          style={styles.touchRange}
          onPress={() =>
            props.navigation ? props.navigation.navigate('게시글 생성') : null
          }>
          <PostAddIcon />
        </TouchableOpacity>
        <DropDown navigation={props.navigation} style={styles.touchRange} />
      </View>
    </View>
  ) : (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{props.type}</Text>
    </View>
  );
}

CustomMainHeader.defaultProps = {
  type: '홈',
  navigation: null,
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    position: 'relative',
  },
  headerTitle: {
    color: 'black',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 5,
  },
  logoImg: {
    height: 32,
    resizeMode: 'contain',
  },
  iconGroup: {
    display: 'flex',
    flexDirection: 'row',
  },
  touchRange: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

export default CustomMainHeader;
