import { createSlice } from '@reduxjs/toolkit'

export const AdminInfoSlice = createSlice({
  name: 'adminInfo',
  initialState: {
    countCenter: 0,
    countMember: 0,
    countBoard: 0,
    reportInfo: {
      totalReport: 0,
      countBefore: 0,
      countIng: 0,
      countCompleted: 0,
    },
    beforeList: [],
    suspendedList: [],
    recentList: [],
    centerTotalInfo: [],
    centerInfo: {},
    userListInfo: [],
    levelBoardCount: [],
  },
  reducers: {
    setAdminInfo: (state, action) => {
      state.countCenter = action.payload.countCenter
      state.countMember = action.payload.countMember
      state.countBoard = action.payload.countBoard
      state.recentList = action.payload.recentList
      state.countMember = action.payload.countMember
      state.reportInfo = action.payload.reportInfo
      state.suspendedList = action.payload.suspendedList
      state.beforeList = action.payload.beforeList
      state.levelBoardCount = action.payload.levelboardCount
    },
    setCenterTotalInfo: (state, action) => {
      state.centerTotalInfo = action.payload
    },
    setCenterInfo: (state, action) => {
      state.centerInfo = action.payload
    },
    setUserListInfo: (state, action) => {
      state.userListInfo = action.payload
    },
  },
})

export const {
  setAdminInfo,
  setCenterTotalInfo,
  setCenterInfo,
  setUserListInfo,
} = AdminInfoSlice.actions

export default AdminInfoSlice.reducer
