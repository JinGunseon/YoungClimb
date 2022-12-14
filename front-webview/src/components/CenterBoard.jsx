import React, { useState, useEffect } from 'react'

import StoreInfo from './center/StoreInfo'
import StoreChart from './center/StoreChart'
import DetailChart from './center/DetailChart'
import { useDispatch, useSelector } from 'react-redux'
import axiosTemp from '../util/axios'
import api from '../util/api'
import { setCenterTotalInfo } from '../reducer/slice/AdminInfoSlice'
import './components.css'
import { useLocation } from 'react-router-dom'

const CenterBoard = () => {
  const location = useLocation()
  const [type, setType] = useState('map')

  const [focusCenter, setFocusCenter] = useState(0)

  const centerTotalInfo = useSelector(state => state.adminInfo.centerTotalInfo)

  const dispatch = useDispatch()
  const accessToken = useSelector(state => state.authToken.accessToken)
  useEffect(() => {
    axiosTemp
      .get(api.fetchCenterTotalInfo(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then(res => {
        dispatch(setCenterTotalInfo(res.data))
        if (location?.state) {
          setFocusCenter(location.state)
        }
      })
      .catch(err => {
        console.log(err)
      })
  }, [])

  return (
    <div className="mainBoardContainer">
      <div className="storeBoard">
        <div className="height100 width100">
          <div className="mapTitleTab">
            <div
              onClick={() => setType('map')}
              className={type === 'map' ? 'activeTab' : 'deactiveTab'}
            >
              지점 지도로 보기
            </div>
            <div
              onClick={() => setType('list')}
              className={type === 'list' ? 'activeTab' : 'deactiveTab'}
            >
              지점 리스트로 보기
            </div>
          </div>
          <StoreInfo
            centerTotalInfo={centerTotalInfo}
            type={type}
            focusCenter={focusCenter}
            setFocusCenter={setFocusCenter}
          ></StoreInfo>
        </div>
      </div>
      <div className="storeBoard">
        <div className="width100 height100">
          {focusCenter ? (
            <DetailChart
              focusCenter={focusCenter}
              setFocusCenter={setFocusCenter}
            ></DetailChart>
          ) : (
            <StoreChart centerTotalInfo={centerTotalInfo}></StoreChart>
          )}
        </div>
      </div>
    </div>
  )
}

export default CenterBoard
