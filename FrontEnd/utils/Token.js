import AsyncStorage from '@react-native-async-storage/async-storage';

// AccessToken 저장 및 삭제
export const setAccessToken = async token => {
  await AsyncStorage.setItem('accessToken', JSON.stringify(token));
};
export const getAccessToken = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return token.replace('"', '').replace('"', '');
};
export const removeAccessToken = () => {
  AsyncStorage.removeItem('accessToken');
};

// refreshToken 저장 및 삭제
export const setRefreshToken = async token => {
  await AsyncStorage.setItem('refreshToken', JSON.stringify(token));
};
export const getRefreshToken = async () => {
  const token = await AsyncStorage.getItem('refreshToken');
  return token.replace('"', '').replace('"', '');
};
export const removeRefreshToken = () => {
  AsyncStorage.removeItem('refreshToken');
};

// {"exp": 50, "expleft": 100, "height": 180, "intro": "이제 된다능 페페", "nickname": "김싸피", "rank": "Y2", "shoeSize": 290, "upto": 2, "wingspan": 210}
export const setCurrentUser = async currentUser => {
  await AsyncStorage.setItem('currentUser', JSON.stringify(currentUser));
};

export const getCurrentUser = async () => {
  const info = await AsyncStorage.getItem('currentUser');
  const currentUser = JSON.parse(info);
  return currentUser;
};

export const removeCurrentUser = () => {
  AsyncStorage.removeItem('currentUser');
};
