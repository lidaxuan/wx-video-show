const app = getApp();
import inter from '../../utils/api'
import cryptoJs from '../../utils/crypto.js';

Page({
    /**
     * 页面的初始数据
     */
    data: {
        getfollowIdArr: [],
        videoList: [],
        noData: false,
        paddingTop: 0,
        courseId: 123,
        firstIn: true,
        index: 0,

        gotoFullScreen: false,
        bindScrollTop:0,
        scrollTop: 0, // 滚动高度
        sonClickGetScrollTop: 0, // 子组件点击之后获取高度
    },
    //请求视频列表
    requestVideoList() {
        let param = {
            //   fil: 1,
            courseId: this.data.courseId,
            index: this.data.index,
            pageSize: 15,
            requestType: 1
        };
        let that = this;
        wx.showLoading({
            title: '正在加载中',
        })
        app.apiRequest("/search/foreign/course/wxPubPlay", param, "post").then(res => {
            wx.hideLoading()
            if (res.data.code == 0) {
                let data = res.data.data;
                data.videos.forEach((ele, i) => {
                    ele.video.transcodeUrl = cryptoJs.decrypt(ele.video.transcodeUrl ? ele.video.transcodeUrl : '')
                    ele.course.courseId = ele.course.id ? ele.course.id  : ''
                    ele.course.collect = ele.course.overCollect ? ele.course.overCollect : false
                    ele.course.thumb = ele.course.overThumb ? ele.course.overThumb : false
                    ele.user = ele.merchant ? ele.merchant : null
                    if (ele.user) {
                        ele.user.relation = 0
                    }
                })
                if (that.data.firstIn) {
                    ///第一次请求数据
                    that.setData({
                        videoList: data.videos
                    })
                    that.setData({
                        firstIn: false
                    })
                } else {
                    ///翻页加载更多
                    that.setData({
                        videoList: that.data.videoList.concat(data.videos)
                    })
                }

                that.setData({
                    index: data.index,
                })
                // 将子组件暂停
                that.stopCurrentVieo()
                that.getMerchantId(data.videos);
            }
            if (that.data.videoList.length <= 0) {
                that.setData({
                    noData: true
                })
            }
        }).catch(error => {
            wx.hideLoading()
        })
    },
    getMerchantId(data) {
        if (!app.judgeIsLogin()) {
            return;
        }
        let followIdArr = [];
        data.forEach(ele => {
            followIdArr.push(ele.merchant.id);
        })
        this.getFollow(followIdArr)
    },
    // 获取关注列表状态
    getFollow(ids) {
        if (!ids.length) return;
        let data = {
            otherId: ids.join(),
            userId: wx.getStorageSync('userInfo').userId
        }
        app.apiRequest('/social/relation/h/relationstatus', data, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    getfollowIdArr: this.data.getfollowIdArr.concat(res.data.data)
                })
                let followInfo = res.data.data;
                this.data.videoList.forEach((ele, index) => {
                    res.data.data.forEach((e, i) => {
                        if (e.otherId == ele.merchant.id) {
                            ele.merchant.relation = e.relation;
                            if (ele.merchant.id == this.data.currentUserId) {
                                ele.merchant.relation = 3;
                            }
                        }
                    })
                })
                this.setData({
                    videoList: this.data.videoList
                })
            } else {
                wx.showToast({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
    },
    // 获取元素高度
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.page-header').boundingClientRect(function(rects) {
            console.log(rects[0].height)
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
    },
    onLoad: function(options) {
        ///获取传进参数
        this.setData({
            courseId: options.courseId
        })
        this.getPaddingTopFn();
        this.requestVideoList();
    },
    // 子组件触发的事件
    videoPlay() {
      this.data.sonClickGetScrollTop = this.data.scrollTop;
    },
    // 获取滚动条当前位置
    scrolltoupper: function (e) {
      let orignalTop = this.data.scrollTop
      this.data.scrollTop = e.detail.scrollTop;

      ///ios 解决全屏回来错位问题
      if (app.getPhoneType() == 1) {
        if (this.data.gotoFullScreen && this.data.scrollTop == 0) {
          this.setData({
              bindScrollTop: orignalTop
          })
          this.data.gotoFullScreen = false
          return
        }
      }

      if ((Math.abs(this.data.scrollTop - this.data.sonClickGetScrollTop)) > 1140) {
        // 将子组件暂停
        this.stopCurrentVieo()
      }
    },
    ///监听播放器的横竖屏
    screenChange(e) {
      let fullScreen = e.detail.detail.fullScreen //值true为进入全屏，false为退出全屏
      if (app.getPhoneType() == 1) {
        if (fullScreen) {
          this.data.gotoFullScreen = true
        }
      } else {
        this.data.gotoFullScreen = fullScreen
      }

    },
    ///暂停视频
    stopCurrentVieo() {
      this.selectComponent("#videoList").videoPlay({
        currentTarget: {
          dataset: {
            index: -2,
          }
        }
      })
    },
    // 上拉加载
    scrolltolower:function () {
      console.log("上拉加载更多")
      this.requestVideoList();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            let videoInfo = res.target.dataset;
            let courseId = videoInfo.item.course.id; //获取产品id
            let title = videoInfo.item.course.title; //获取产品标题
            let cover = videoInfo.item.video.cover; //产品图片
            if (app.judgeIsLogin()) {
              inter.inter.shareFn(courseId); // 调用分享接口
            }
            return {
                title: title,
                path: 'pages/index/index?courseId=' + courseId + '&upperId=' + wx.getStorageSync('userInfo').userId,
                imageUrl: cover, //不设置则默认为当前页面的截图
            }
        } else if (res.from == 'menu') {
            return {
                title: '热爱就要秀出来，这里有健身大咖的更多超清课程，快来观看啊～',
                path: '/pages/index/index',
                imageUrl: '/static/img/share_cover.png',
            }
        }
    }
})