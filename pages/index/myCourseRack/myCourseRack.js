// pages/index/myCourseRack/myCourseRack.js
const app = getApp();
Component({
  properties: {

  },
  data: {
    showplaceholder: true, ///是否展示占位图
    canPullupRefresh: false, //是否可以上拉加载
    courseListCount: 4, ///默认推荐4条
    courseData: [], ///推荐课程data
    mycourseList: [], //我的课架
    pageSize: 10, ///学习记录size
    pageIndex: 1, ///学习记录page
  },
  methods: {
    onLoad: function () {
      wx.showLoading({
        title: '正在加载中',
      })
      this.requesMyCoursetData()
    },
    ///请求我的课架
    requesMyCoursetData() {
      if (!app.judgeIsLogin()) {
        wx.hideLoading()
        return
      }
      let that = this;
      let param = {
        pageIndex: this.data.pageIndex,
        pageSize: this.data.pageSize,
      };
      app.apiRequest("/course/boughtCourse", param, "get").then(res => {
        wx.hideLoading()
        let data = res.data.data;
        if (data.length == 0 && that.data.mycourseList.length == 0) {
          that.requestRecommendCourse();
        } else {
          that.setData({
            canPullupRefresh: true,
            showplaceholder: false,
          })
          ///是否刷新
          if (that.data.pageIndex == 1) {
            that.setData({
              mycourseList: data,
            })
          } else {
            that.setData({
              mycourseList: that.data.mycourseList.concat(data),
            })
          }
        }
        if (res.data.code == 0) {
          this.setData({
            pageIndex: that.data.pageIndex + 1,
          })
        }
      }).catch(error => {
        wx.hideLoading()
      });
    },
    ///请求推荐课程
    requestRecommendCourse() {
      if (!app.judgeIsLogin()) return
      let that = this;
      let param = {
        pageSize: this.data.courseListCount,
        free: 2,
        duration: 1,
      };
      app.apiRequest("/search/foreign/course/cl", param, "post").then(res => {
        let data = res.data.data;
        console.log(data);
        if (res.data.code == 0) {
          this.setData({
            courseData: data,
          })
        }
      }).catch(error => {

      });
    },
    ///上拉加载
    loadMoreData: function() {
      if (this.data.canPullupRefresh) {
        this.requesMyCoursetData();
      }
    },
  },
  lifetimes: {
    attached: function () {
      // 在组件实例进入页面节点树时执行
      this.onLoad()
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },
  pageLifetimes:{
    show: function () {
      // 页面被展示
      this.onLoad()
    },
  }
})