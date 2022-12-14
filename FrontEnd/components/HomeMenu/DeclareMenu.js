import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import axios from 'axios'
import api from '../../utils/api'
import { getAccessToken } from '../../utils/Token'
import getConfig from '../../utils/headers'

const DeclareMenu = ({navigation,focusedContent,setModalVisible}) => {
  const [selected, setSelected] = useState(0)
  const [declareList, setDeclareList] = useState([
    { id: 1,
      text:'스팸',
      selected: false
    },
    { id: 2,
      text:'혐오 발언 및 상징',
      selected: false
    },
    { id: 3,
      text:'상품 판매 등 상업 활동',
      selected: false
    },
    { id: 4,
      text:'실제 문제 난이도와 게시물 상 난이도가 다릅니다',
      selected: false
    },
    { id: 5,
      text:'풀이를 완료하지 못한 문제를 완료로 표기했습니다',
      selected: false
    },
    ])

  useFocusEffect(()=>{
    BackHandler.removeEventListener('hardwareBackPress')
    const backAction = ()=>{
      navigation.navigate('메뉴메인')
      return true  
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress',backAction);
    return () =>{backHandler.remove();}
  })
  
  useEffect(()=>{
    setDeclareList(
      declareList.map((option)=>{
        if (option.id === selected) {
          option.selected = true
        } else{
          option.selected = false
        }
        return option
      })
    )
  },[selected])
  
    const handleChoice = (id) => {
      if (id === selected) {
        setSelected(0)
      } else {
        setSelected(id)
      }
  }


  const onSubmit =async () => {
    // axios 요청
    try{
      const res = await axios.post(api.report(focusedContent.id), {content:selected}, await getConfig())
      if (res.data) {
        
        Alert.alert('신고 완료','해당 게시물이 성공적으로 신고되었습니다.',
        [
          {
            text: 'ok',
            onPress:() => {
              setModalVisible(false)
            },
          },
        ],
        { cancelable: false },
        )
      }
      else if (!res.data) {
        Alert.alert('신고 실패','이미 신고한 게시물입니다.',
        [
          {
            text: 'ok',
            onPress:() => {
              setModalVisible(false)
            },
          },
        ],
        { cancelable: false },
        )
      }
    }catch{err=>
      Alert.alert('신고 실패','유효하지 않은 요청입니다.',
      [
        {
          text: 'ok',
          onPress:() => {
            setModalVisible(false)
          },
        },
      ],
      { cancelable: false },
      )}
  }
  
  return (
    <View style={styles.container}>
      <Text style={{marginBottom:10}}>이 게시물을 신고하는 이유를 선택해주세요</Text>
      {declareList.map((option, idx)=>{
        return(
          <TouchableOpacity
            onPress={()=>{handleChoice(option.id)}} 
            key={idx}
            style={{...styles.option, backgroundColor: option.selected ? 'rgba(243,77,127,0.3)':'rgba(0,0,0,0)'}}>
            <Text style={{color:'#525252', fontWeight:option.selected ?'600':'400', marginLeft:2}}>{option.text}</Text>
          </TouchableOpacity>
        )
      })}
      <TouchableOpacity 
        onPress={onSubmit}
        style={styles.submitBtn}>
        <Text style={{ color:'white', fontWeight:'700', fontSize:16}}>완료</Text>
      </TouchableOpacity>
    </View>
  )
}

export default DeclareMenu

const styles = StyleSheet.create({
  container: {
    paddingHorizontal:20,
    paddingVertical: 10,
    backgroundColor: 'white',
    height:320,
    width:'100%'},
  option: {
    width:'100%',
    height:35,
    padding:5,
    justifyContent:'center',
    marginVertical:2.5
  },
  submitBtn:{
    height:40,
    width:'100%',
    backgroundColor:'#F34D7F',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5,
    marginTop:17
  }

})