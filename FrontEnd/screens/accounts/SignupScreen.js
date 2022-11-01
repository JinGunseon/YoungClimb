import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import Input from '../../components/Input';
import {
  changeSignupForm,
  checkEmail,
  checkNickname,
  changeIsCheckTerms,
  signup,
} from '../../utils/slices/AccountsSlice';

import CustomButton from '../../components/CustomBtn';

import logo from '../../assets/image/main/signup.png';
import checkIcon from '../../assets/image/main/done.png';
import checked from '../../assets/image/main/checked.png';
import unChecked from '../../assets/image/main/unchecked.png';
import camera from '../../assets/image/main/camera.png';
import BackIcon from '../../assets/image/header/backIcon.svg';
import NextIcon from '../../assets/image/header/nextIcon.svg';

const windowHeight = Dimensions.get('window').height;

function SignupScreen({navigation}) {
  const dispatch = useDispatch();

  const signupForm = useSelector(state => state.accounts.signupForm);

  function updateInput(name, value) {
    dispatch(changeSignupForm({name, value}));
  }

  return (
    <FirstPage
      navigation={navigation}
      signupForm={signupForm}
      updateInput={updateInput}
    />
  );
}

const FirstPage = ({navigation, signupForm, updateInput}) => {
  const dispatch = useDispatch();

  const isCheckEmail = useSelector(state => state.accounts.isCheckEmail);
  const isCheckNickname = useSelector(state => state.accounts.isCheckNickname);
  const isCheckTerms = useSelector(state => state.accounts.isCheckTerms);
  const [passwordError, setPasswordError] = useState('비밀번호를 입력해주세요');

  // 정보 입력 완료 시 다음 페이지 이동
  function goNextPage() {
    if (
      false
      // !isCheckNickname ||
      // !isCheckEmail
    ) {
      // alert('정보를 입력하세요.');
    } else if (!isCheckTerms) {
      alert('약관에 동의해주세요.');
    } else if (passwordError) {
      alert(passwordError);
    } else if (signupForm.password.value !== signupForm.confirmPwd.value) {
      alert('비밀번호 확인이 일치하지 않습니다.');
    } else {
      navigation.push('추가정보');
    }
  }

  function chkPW() {
    const pw = signupForm.password.value;
    var num = pw.search(/[0-9]/g);
    var eng = pw.search(/[a-z]/gi);
    var spe = pw.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);

    if (pw.length < 8 || pw.length > 20) {
      setPasswordError('비밀번호를 8자리 ~ 20자리 이내로 입력해주세요.');
      return false;
    } else if (pw.search(/\s/) !== -1) {
      setPasswordError('비밀번호는 공백 없이 입력해주세요.');
      return false;
    } else if (num < 0 || eng < 0 || spe < 0) {
      setPasswordError('비밀번호는 영문,숫자,특수문자를 포함해야 합니다.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  }

  function chkEmail(str) {
    const reg_email =
      /^([0-9a-zA-Z._-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/;

    if (!reg_email.test(str)) {
      return false;
    } else {
      return true;
    }
  }

  function onCheckEmail() {
    const data = {email: signupForm.email.value};
    if (chkEmail(data.email)) {
      dispatch(checkEmail(data));
    } else {
      alert('이메일 형식이 올바르지 않습니다.');
    }
  }
  function onCheckNickname() {
    const data = {nickname: signupForm.nickname.value};
    dispatch(checkNickname(data));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.title} />
      </View>
      <View style={styles.inputBox}>
        <Input
          style={styles.input}
          placeholder="닉네임"
          placeholderTextColor={'#ddd'}
          width="78%"
          value={signupForm.nickname.value}
          type={signupForm.nickname.type}
          onChangeText={value => updateInput('nickname', value)}
        />
        <CheckButton
          type="nickname"
          onPress={onCheckNickname}
          buttonColor={isCheckNickname ? '#F34D7F' : 'white'}
          borderColor={!isCheckNickname && '#F34D7F'}
          title={
            isCheckNickname ? (
              <Image source={checkIcon} />
            ) : (
              <Text style={styles.checkTitle}>확인</Text>
            )
          }
        />
      </View>
      <View style={styles.inputBox}>
        <Input
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor={'#ddd'}
          width="78%"
          value={signupForm.email.value}
          type={signupForm.email.type}
          onChangeText={value => updateInput('email', value)}
        />

        <CheckButton
          type="email"
          onPress={onCheckEmail}
          buttonColor={isCheckEmail ? '#F34D7F' : 'white'}
          borderColor={!isCheckEmail && '#F34D7F'}
          borderWidth="3"
          title={
            isCheckEmail ? (
              <Image source={checkIcon} />
            ) : (
              <Text style={styles.checkTitle}>확인</Text>
            )
          }
        />
      </View>
      <Input
        style={styles.input}
        value={signupForm.password.value}
        type={signupForm.password.type}
        secureTextEntry={true}
        placeholder="비밀번호"
        height={30}
        onEndEditing={() => chkPW()}
        placeholderTextColor={'#ddd'}
        onChangeText={value => updateInput('password', value)}
      />
      <Input
        style={styles.input}
        value={signupForm.confirmPwd.value}
        type={signupForm.confirmPwd.type}
        secureTextEntry={true}
        placeholder="비밀번호 확인"
        height={30}
        placeholderTextColor={'#ddd'}
        onChangeText={value => updateInput('confirmPwd', value)}
      />
      <View style={styles.genderGroup}>
        <View style={styles.gender}>
          <CustomButton
            buttonColor={
              signupForm.gender.value === 'M' ? '#F34D7F' : '#F3F3F3'
            }
            titleColor={signupForm.gender.value === 'M' ? 'white' : '#7E7E7E'}
            title="남성"
            onPress={() => updateInput('gender', 'M')}
          />
        </View>

        <View style={styles.gender}>
          <CustomButton
            buttonColor={
              signupForm.gender.value === 'F' ? '#F34D7F' : '#F3F3F3'
            }
            titleColor={signupForm.gender.value === 'F' ? 'white' : '#7E7E7E'}
            title="여성"
            onPress={() => updateInput('gender', 'F')}
          />
        </View>
      </View>
      <View style={styles.termsGroup}>
        {isCheckTerms ? (
          <TouchableOpacity onPress={() => dispatch(changeIsCheckTerms(false))}>
            <Image source={checked} style={styles.checkBox} alt="checkBox" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('약관')}>
            <Image source={unChecked} style={styles.checkBox} alt="checkBox" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('약관')}>
          <Text style={styles.link}>&nbsp; 약관</Text>
        </TouchableOpacity>
        <Text style={styles.text}>&nbsp; 동의</Text>
      </View>
      <View style={styles.linkGroup}>
        <TouchableOpacity onPress={() => navigation.navigate('로그인')}>
          <Text style={styles.link}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.next} onPress={goNextPage}>
          <Text style={styles.nextText}>다음</Text>
          <NextIcon style={{marginLeft: 5, marginRight: 5}} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SecondPage = ({navigation, signupForm, setPage, updateInput}) => {
  const dispatch = useDispatch();

  function goBeforePage() {
    setPage(false);
  }

  function onSubmitSignup(isSkip) {
    const data = {
      email: signupForm.email.value,
      nickname: signupForm.nickname.value,
      password: signupForm.password.value,
      gender: signupForm.gender.value,
    };

    // 건너뛰기 클릭 시 추가정보 제외하고 회원가입 신청
    if (isSkip) {
      dispatch(signup(data)).then(() => {
        navigation.navigate('완료');
      });
    } else {
      data.height = signupForm.height.value;
      data.shoeSize = signupForm.shoeSize.value;
      data.wingspan = signupForm.shoeSize.value;

      dispatch(signup(data)).then(() => {
        navigation.navigate('완료');
      });
      console.log('확인');
    }
  }

  function goWingspan() {
    if (signupForm.height.value) {
      navigation.navigate('윙스팬', {
        height: signupForm.height.value,
        type: 'signup',
      });
    } else {
      alert('윙스팬 측정을 위해 키를 먼저 입력해주세요.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.title} />
      </View>
      <View style={styles.comment}>
        <Text style={styles.comment}>
          더 즐거운 클라이밍 생활을 위해 상세 정보를 입력해주세요 :)
        </Text>
        <Text style={styles.comment}>
          회원님과 비슷한 유저를 파악하고 정보를 얻을 수 있어요
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <Input
          style={styles.input}
          placeholder="키(cm)"
          placeholderTextColor={'#ddd'}
          value={signupForm.height.value}
          maxLength={3}
          type={signupForm.height.type}
          onChangeText={value => updateInput('height', value)}
        />
        <Input
          style={styles.input}
          placeholder="신발(mm)"
          placeholderTextColor={'#ddd'}
          maxLength={3}
          value={signupForm.shoeSize.value}
          type={signupForm.shoeSize.type}
          onChangeText={value => updateInput('shoeSize', value)}
        />
        <View style={styles.inputBox}>
          <Input
            style={styles.input}
            placeholder="윙스팬(cm)"
            width="100%"
            placeholderTextColor={'#ddd'}
            maxLength={3}
            value={signupForm.wingspan.value}
            type={signupForm.wingspan.type}
            onChangeText={value => updateInput('wingspan', value)}
          />
          <TouchableOpacity onPress={goWingspan}>
            <Image source={camera} style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.btnGroup}>
        <View style={styles.button}>
          <CustomButton
            titleColor="#7E7E7E"
            buttonColor="#F3F3F3"
            title="건너뛰기"
            onPress={() => onSubmitSignup(true)}
          />
        </View>
        <View style={styles.button}>
          <CustomButton
            buttonColor="#F34D7F"
            title="완료"
            onPress={() => onSubmitSignup(false)}
          />
        </View>
      </View>
      <TouchableOpacity onPress={goBeforePage} style={styles.before}>
        <Text style={styles.before}>이전</Text>
      </TouchableOpacity>
    </View>
  );
};

function CheckButton({onPress, buttonColor, borderColor, title}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.checkBtn,
        {
          backgroundColor: buttonColor,
          borderColor,
        },
      ]}>
      {title}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    marginTop: windowHeight / 10,
    alignItems: 'center',
    width: '100%',
    height: '15%',
  },
  title: {
    width: '100%',
    resizeMode: 'contain',
  },
  comment: {
    textAlign: 'center',
    color: 'black',
  },
  inputContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  inputBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '80%',
    height: 60,
  },
  input: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '45%',
  },
  genderGroup: {
    width: '80%',
    display: 'flex',
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gender: {
    width: '45%',
  },
  termsGroup: {
    display: 'flex',
    flexDirection: 'row',
    margin: 10,
  },
  checkBox: {
    width: 20,
    height: 20,
  },
  linkGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  link: {
    color: '#F34D7F',
  },
  next: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    color: 'black',
    fontSize: 16,
  },
  checkBtn: {
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1.5,
    width: 60,
    height: 40,
  },
  checkTitle: {
    fontSize: 15,
    color: 'black',
  },
  cameraIcon: {
    position: 'absolute',
    right: 0,
    top: -30,
  },
  btnGroup: {
    width: '80%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 30,
  },
  text: {
    color: 'black',
  },
  before: {
    width: '80%',
    marginTop: 20,
    color: 'black',
  },
});

export default SignupScreen;
