import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {TextInput} from 'react-native-gesture-handler';
import {useSelector} from 'react-redux';
import CustomSubHeader from '../../components/CustomSubHeader';
import FollowBtn from '../../components/FollowBtn';
import UserAvatar from '../../components/UserAvatar';

import FollowLoading from '../../components/Loading/FollowLoading';
import {fetchFollowList} from '../../utils/slices/ProfileSlice';

import searchIcon from '../../assets/image/profile/searchIcon.png';

function FollowScreen({navigation, route}) {
  const dispatch = useDispatch();

  const [type, setType] = useState(route.params.type);
  const [keyword, setKeyword] = useState('');

  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    if (isFocused) {
      dispatch(fetchFollowList(route.params.nickname)).then(() => {
        setIsLoading(false);
      });
    }
  }, [dispatch, route, isFocused]);

  const followings = useSelector(state => state.profile.followInfo?.followings);
  const followers = useSelector(state => state.profile.followInfo?.followers);
  const followingNum = useSelector(
    state => state.profile.followInfo?.followingNum,
  );
  const followerNum = useSelector(
    state => state.profile.followInfo?.followerNum,
  );

  return (
    <>
      {isLoading ? (
        <FollowLoading navigation={navigation} type={type} route={route} />
      ) : (
        <>
          <CustomSubHeader
            title={route.params.nickname}
            navigation={navigation}
          />
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}>
            {type === 'following' ? (
              <View style={styles.tabBox}>
                <TouchableOpacity onPress={() => {}} style={styles.activeTab}>
                  <Text
                    style={[
                      styles.tabFont,
                      {fontWeight: 'bold', color: 'white'},
                    ]}>
                    ?????????({followingNum})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setType('follower');
                  }}
                  style={styles.tabBtn}>
                  <Text style={styles.tabFont}>?????????({followerNum})</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tabBox}>
                <TouchableOpacity
                  onPress={() => {
                    setType('following');
                  }}
                  style={styles.tabBtn}>
                  <Text style={styles.tabFont}>?????????({followingNum})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}} style={styles.activeTab}>
                  <Text
                    style={[
                      styles.tabFont,
                      {fontWeight: 'bold', color: 'white'},
                    ]}>
                    ?????????({followerNum})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="???????????? ???????????????."
                placeholderTextColor={'#ADADAD'}
                value={keyword}
                onChangeText={value => setKeyword(value)}
              />
              <Image style={styles.searchIcon} source={searchIcon} />
            </View>

            <FollowList
              follows={type === 'following' ? followings : followers}
              type={type}
              keyword={keyword}
              navigation={navigation}
              profileUser={route.params.nickname}
            />
          </ScrollView>
        </>
      )}
    </>
  );
}

function FollowList({follows, keyword, navigation, type, profileUser}) {
  const searchResult = follows.filter(follow =>
    follow.nickname.includes(keyword),
  );

  return (
    <View style={styles.followContainer}>
      {searchResult.map((item, i) => {
        return (
          <FollowItem
            key={i}
            idx={i}
            type={type}
            item={item}
            navigation={navigation}
            profileUser={profileUser}
          />
        );
      })}
    </View>
  );
}

// ????????? ????????? ???????????? follow ?????? api??????????????? item.follow
function FollowItem({item, navigation, type, idx, profileUser}) {
  return (
    <>
      <View style={styles.followItem}>
        <TouchableOpacity
          onPress={() => {
            navigation.push('???????????????', {
              initial: false,
              nickname: item.nickname,
            });
          }}
          style={styles.followItemInfo}>
          <UserAvatar source={{uri: item.image}} size={45} />
          <View style={styles.profileBox}>
            <Text style={styles.nickname}>{item.nickname}</Text>
            <Text style={styles.text}>
              {item.gender === 'M' ? '??????' : '??????'}{' '}
              {item.height ? `${item.height}cm` : null}{' '}
              {item.shoeSize ? `${item.shoeSize}mm` : null}{' '}
              {item.wingspan ? `????????? ${item.wingspan}cm` : null}
            </Text>
          </View>
        </TouchableOpacity>

        <FollowBtn
          idx={idx}
          type={type}
          follow={item.follow}
          nickname={item.nickname}
          profileUser={profileUser}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    // alignItems: 'center',
    // justifyContent: 'flex-start',
  },
  tabBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtn: {
    width: '50%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4F4',
  },
  activeTab: {
    width: '50%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F34D7F',
  },
  searchBox: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  searchInput: {
    width: '80%',
    borderWidth: 1,
    borderBottomColor: '#464646',
    borderRadius: 10,
    fontSize: 14,
    padding: 5,
    paddingLeft: 40,
    color: 'black',
  },
  searchIcon: {
    position: 'absolute',
    top: 7,
    left: '12%',
  },
  followContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followItem: {
    width: '90%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  followItemInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBox: {
    marginLeft: 5,
  },
  tabFont: {
    fontSize: 15,
    color: 'black',
  },
  nickname: {color: 'black', fontSize: 14, fontWeight: 'bold'},
  text: {color: 'black', fontSize: 12},
});

export default FollowScreen;
