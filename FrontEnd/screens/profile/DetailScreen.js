/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import Video from 'react-native-video';

import UserAvatar from '../../components/UserAvatar';
import HoldLabel from '../../components/HoldLabel';
import LevelLabel from '../../components/LevelLabel';
import CustomSubHeader from '../../components/CustomSubHeader';
import DeclareSheet from '../../components/DeclareSheet';
import Comment from '../../components/Comment';

import {YCLevelColorDict} from '../../assets/info/ColorInfo';
import {fetchDetail, likeBoard, scrapBoard} from '../../utils/slices/PostSlice';

import MenuIcon from '../../assets/image/feed/menuIcon.svg';
import CameraIcon from '../../assets/image/feed/whiteCamera.svg';
import EmptyHeart from '../../assets/image/feed/emptyHeart.svg';
import FillHeart from '../../assets/image/feed/fillHeart.svg';
import EmptyScrap from '../../assets/image/feed/emptyScrap.svg';
import FillScrap from '../../assets/image/feed/fillScrap.svg';
import EyeIcon from '../../assets/image/feed/eye.svg';
import HoldIcon from '../../assets/image/hold/hold.svg';
import PlayBtn from '../../assets/image/videoBtn/playBtn.svg';
import RefreshBtn from '../../assets/image/videoBtn/refreshBtn.svg';
import MuteBtn from '../../assets/image/videoBtn/muteBtn.svg';
import SoundBtn from '../../assets/image/videoBtn/soundBtn.svg';
import Trash from '../../assets/image/feed/trash.svg';

import CommentInput from '../../components/CommentInput';
import {deleteBoard} from '../../utils/slices/ProfileSlice';
import {viewCount} from '../../utils/slices/PostSlice';
import DetailLoading from '../../components/Loading/DetailLoading';

function DetailScreen({navigation, route}) {
  const dispatch = useDispatch();

  const currentUser = useSelector(state => state.accounts.currentUser);

  const [isLoading, setIsLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [focusedContent, setFocusedContent] = useState(null);
  const [closeSignal, setCloseSignal] = useState(0);

  const [isMuted, setIsMuted] = useState(true);
  const [isView, setIsView] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isBuffer, setIsBuffer] = useState(false);
  const [isCounted, setIsCounted] = useState(false);
  const [viewCounts, setViewCounts] = useState(0);

  const changeMuted = () => {
    setIsMuted(!isMuted);
  };

  const changePlay = () => {
    if (isFinished) {
      setIsView(true);
      setIsCounted(false);
    } else {
      setIsView(!isView);
    }
  };

  const changeFinished = () => {
    setIsView(false);
    setIsFinished(true);
  };

  const countView = log => {
    if (!isCounted) {
      if (log.currentTime / log.seekableDuration > 0.1) {
        setIsCounted(true);
        dispatch(viewCount(route.params.id)).then(res => {
          if (res.type === 'viewCount/fulfilled') {
            setViewCounts(viewCounts + 1);
          }
        });
      }
    }
  };

  const openMenu = feed => {
    setModalVisible(true);
    setFocusedContent({...feed, isRecommend: false});
  };

  const feed = useSelector(state => state.post.boardInfo);
  const comments = useSelector(state => state.post.commentInfo);

  const isFocused = useIsFocused();

  useEffect(() => {
    setIsLoading(true);
    if (isFocused) {
      dispatch(fetchDetail(route.params.id)).then(() => {
        setIsLoading(false);
        setIsView(true);
        setIsFinished(false);
        setViewCounts(feed.view);
      });
    }
  }, [dispatch, isFocused, feed.view]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsMuted(true);
        setIsView(false);
        setIsFinished(false);
      };
    }, []),
  );

  function onClickHeart() {
    dispatch(likeBoard(route.params.id));
  }

  function onClickScrap() {
    dispatch(scrapBoard(route.params.id));
  }

  function onDelete(boardId) {
    dispatch(deleteBoard(boardId)).then(() => {
      Alert.alert('?????????????????????.');
      navigation.goBack();
    });
  }

  return (
    <>
      <CustomSubHeader title="?????????" navigation={navigation} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <DetailLoading />
        ) : (
          <>
            <View style={styles.contentContainer}>
              <View style={styles.feedHeader}>
                <View style={styles.headerTop}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.push('???????????????', {
                        initial: false,
                        nickname: feed.createUser.nickname,
                      });
                    }}
                    activeOpacity={1}
                    style={styles.iconText}>
                    <UserAvatar
                      source={{uri: feed.createUser.image}}
                      size={36}
                    />
                    <View style={styles.headerTextGroup}>
                      <View style={{...styles.iconText, alignItems: 'center'}}>
                        <Text
                          style={[
                            styles.feedTextStyle,
                            {
                              fontSize: 16,
                              fontWeight: '600',
                              marginRight: 5,
                            },
                          ]}>
                          {feed.createUser?.nickname}
                        </Text>
                        <HoldIcon
                          width={18}
                          height={18}
                          color={YCLevelColorDict[feed.createUser?.rank]}
                        />
                      </View>
                      <Text style={{...styles.feedTextStyle, fontSize: 12}}>
                        {feed.createdAt}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {feed.createUser.nickname === currentUser.nickname ? (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('????????? ??????', '?????? ?????????????????????????', [
                          {text: '??????', onPress: () => onDelete(feed.id)},
                          {
                            text: '??????',
                            onPress: () => Alert.alert('', '?????????????????????.'),
                          },
                        ]);
                      }}>
                      <Trash />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      hitSlop={10}
                      onPress={() => openMenu(feed)}>
                      <MenuIcon width={16} height={16} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.wallInfo}>
                  <Text style={{...styles.feedTextStyle, marginRight: 8}}>
                    {feed.centerName}
                  </Text>
                  {feed.wallName ? (
                    <Text style={{...styles.feedTextStyle, marginRight: 8}}>
                      {feed.wallName}
                    </Text>
                  ) : null}
                  <Text style={{...styles.feedTextStyle, marginRight: 3}}>
                    {feed.difficulty}
                  </Text>
                  <LevelLabel color={feed.centerLevelColor} />
                  <HoldLabel color={feed.holdColor} />
                </View>
              </View>

              <View
                style={{
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').width,
                }}>
                <TouchableOpacity
                  style={styles.videoBox}
                  activeOpacity={1}
                  onPress={changePlay}>
                  <Video
                    source={{uri: feed.mediaPath}}
                    style={styles.backgroundVideo}
                    fullscreen={false}
                    resizeMode={'contain'}
                    repeat={false}
                    controls={false}
                    paused={!isView}
                    muted={isMuted}
                    onseek={() => null}
                    onBuffer={res => {
                      setIsBuffer(res.isBuffering);
                    }}
                    onProgress={res => countView(res)}
                    onEnd={changeFinished}
                  />
                  {/* ????????? ?????? ?????? */}
                  {!isView ? (
                    <View
                      style={{
                        ...styles.videoBox,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                      }}>
                      {isFinished ? (
                        <RefreshBtn color="white" width={70} height={120} />
                      ) : (
                        <PlayBtn color="white" width={70} height={120} />
                      )}
                    </View>
                  ) : null}
                </TouchableOpacity>
                {/* ????????? ?????? */}
                {isView ? (
                  isMuted ? (
                    <TouchableOpacity
                      style={styles.muteIcon}
                      activeOpacity={1}
                      onPress={changeMuted}>
                      <MuteBtn color="white" width={60} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.muteIcon}
                      activeOpacity={1}
                      onPress={changeMuted}>
                      <SoundBtn color="white" width={60} />
                    </TouchableOpacity>
                  )
                ) : null}
                {/* ????????? */}
                {isBuffer ? (
                  <View
                    style={{
                      ...styles.background,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      justifyContent: 'center',
                    }}>
                    <ActivityIndicator size="large" color="white" />
                  </View>
                ) : null}
                <View style={styles.solvedDate}>
                  <CameraIcon />
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 12,
                      marginLeft: 3,
                      marginTop: 1,
                    }}>
                    {feed.solvedDate}
                  </Text>
                </View>
              </View>

              <View style={styles.popularInfo}>
                <View style={styles.likeGroup}>
                  <View style={styles.iconText}>
                    <TouchableOpacity onPress={onClickHeart}>
                      {feed.isLiked ? (
                        <FillHeart style={{marginRight: 5}} />
                      ) : (
                        <EmptyHeart style={{marginRight: 5}} />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.feedTextStyle}>
                      {feed.like} ?????? ???????????????.
                    </Text>
                  </View>
                  {feed.createUser.nickname === currentUser.nickname ? null : (
                    <TouchableOpacity onPress={onClickScrap}>
                      {feed.isScrap ? (
                        <FillScrap style={{marginRight: 5}} />
                      ) : (
                        <EmptyScrap style={{marginRight: 5}} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.iconText}>
                  <EyeIcon style={{marginRight: 5}} />
                  <Text style={styles.feedTextStyle}>
                    {viewCounts} ?????? ??????????????????.
                  </Text>
                </View>
              </View>

              <View style={styles.contentSummary}>
                {feed.content ? (
                  <Text style={styles.contentPreview}>{feed.content}</Text>
                ) : null}
              </View>
            </View>
            {comments.length
              ? comments?.map((comment, idx) => {
                  return (
                    <Comment
                      key={idx}
                      boardId={feed.id}
                      comment={comment}
                      navigation={navigation}
                    />
                  );
                })
              : null}
          </>
        )}
      </ScrollView>

      <CommentInput boardId={route.params.id} navigation={navigation} />
      {modalVisible ? (
        <TouchableOpacity
          style={{...styles.background}}
          onPress={() => setCloseSignal(closeSignal + 1)}
        />
      ) : (
        <></>
      )}
      <DeclareSheet
        navigation={navigation}
        route={route}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        focusedContent={focusedContent}
        closeSignal={closeSignal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginBottom: 50,
  },
  feedHeader: {
    margin: 8,
  },
  headerTop: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconText: {
    display: 'flex',
    flexDirection: 'row',
  },
  headerTextGroup: {
    marginLeft: 8,
    display: 'flex',
    justifyContent: 'space-between',
  },
  feedTextStyle: {
    color: 'black',
    fontSize: 14,
  },
  wallInfo: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 5,
    marginLeft: 5,
  },
  videoBox: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  solvedDate: {
    display: 'flex',
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  popularInfo: {
    marginTop: 8,
    marginHorizontal: 8,
  },
  likeGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contentSummary: {
    width: '100%',
    paddingTop: 3,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  contentPreview: {
    color: 'black',
    fontSize: 14,
    lineHeight: 16,
  },
  viewFullContent: {
    padding: 1,
  },
  commentSummary: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  commentPreview: {
    display: 'flex',
    flexDirection: 'row',
  },
  background: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  text: {color: 'black', marginHorizontal: 10},
  muteIcon: {
    position: 'absolute',
    bottom: 25,
    right: 0,
    width: 50,
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    borderBottomWidth: 0.2,
    borderColor: 'black',
  },
});

export default DetailScreen;
