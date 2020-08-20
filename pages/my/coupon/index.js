const app = getApp();
import regeneratorRuntime from '../../../utils/runtime'

Page({
  data: {
    headerHeight: 0,
    tabCurrentIndex: 0,
    dataList: [{
        title: "未使用",
        pageIndex: 1,
        pageSize: 15,
        showHeadView:true,///商家信息view
        hasMoreData:true,///是否有更多数据
        noData:false,///是否有数据
        data: []///数据
      },
      {
        title: "已使用",
        pageIndex: 1,
        pageSize: 15,
        showHeadView: false,
        hasMoreData: true,
        noData: false,
        data: []
      },
      {
        title: "已过期",
        pageIndex: 1,
        pageSize: 15,
        showHeadView: false,
        hasMoreData: true,
        noData: false,
        data: []
      },
    ]
  },

  onLoad: function(options) {
    this.getElementHeight()
    this.getData()
  },
  onShow:function(){
    this.getElementHeight()
  },
  onPullDownRefresh:function(){

  },
  onReachBottom: function () {
    if (this.getCurrentDataItem().hasMoreData) {
      this.getData()
    }
  },
  getData: function() {
    //请求数据type
    let requestType = this.data.tabCurrentIndex + 1
    let param = {
      useType: requestType,
      pageIndex: this.getCurrentDataItem().pageIndex,
      pageSize: this.getCurrentDataItem().pageSize
    }
    let _this = this
    wx.showLoading({
      title: '正在加载',
    })
    app.apiRequest("/coupon/enroll/myCouponList", param, "get").then(res => {
      wx.hideLoading()
      let data = res.data.data;
      let currentItem = _this.getCurrentDataItem()
      let isRefresh = currentItem.pageIndex == 1
      ///type 不为1 时,修复数据格式
      if (requestType != 1){
        let newData = []
        data.forEach((ele,i)=>{
          let newEle = {}
          newEle.myCouponVos = [ele]
          newData.push(newEle)
        })
        data = newData
      }
      if (res.data.code == 0) {
        if (data.length > 0){
          let currentIndex = _this.data.tabCurrentIndex
          let tempData = 'dataList[' + currentIndex + '].data'
          if (isRefresh) {
            _this.setData({
              [tempData]: data
            })
          } else {
            _this.setData({
              [tempData]: currentItem.data.concat(data)
            })
          }
        }
        _this.setData({
          ['dataList[' + _this.data.tabCurrentIndex + '].pageIndex']:currentItem.pageIndex+1,
          ['dataList[' + _this.data.tabCurrentIndex + '].hasMoreData']: data.length > 0,
          ['dataList[' + _this.data.tabCurrentIndex + '].noData']:currentItem.data.length <= 0
        })
        console.log(_this.data.dataList)
      }
    }).catch(error => {
      wx.hideLoading()
    })

  },

  async getElementHeight() {
    let h = await app.getElementHeight('.header');
    this.setData({
      headerHeight: h
    });
  },

  getCurrentDataItem: function() {
    return this.data.dataList[this.data.tabCurrentIndex]
  },
  clickGoinStore(e){
    this.clickUserHead(e)
  },
  clickUserHead(e){
    let userId = e.currentTarget.dataset.item.userId
    app.goUserPage(userId)
  },
  switchCourseList(e) {
    //改变下标
    this.setData({
      tabCurrentIndex: e.currentTarget.dataset.index - 0,
    });
    console.log(this.data.tabCurrentIndex)
    ///控制隐藏显示view
    let currentItem = this.getCurrentDataItem()
    ///没有数据去请求
    if (currentItem.data.length <= 0){
      this.getData()
    }
  }
})
