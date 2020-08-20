const app = getApp()
import api from '../../api/api';
var notification = require('../../components/WxNotificationCenter/WxNotificationCenter.js')


Page({
    // {
    //     "userName": "Love马尔代夫",
    //     "gender": 1, //1男
    //     "nick": "你妹", //名字
    //     "head": "http://zj", //头像
    //     "slogan": "没有z", //签名
    //     "area": "中国z", //位置
    //     "status": 1,
    //     "authType": 1, //认证的类型(1是普通身份认证，2是达人认证 , 3是 企业认证)
    //     "type": null,
    //     "days": null,
    //     "authTitle": "全国第一", //认证称号
    //     "coverUrl": null,
    //     "endTime": null,
    //     "phone": "18812345678"，
    //     "deviceToken": "zzj",
    //     "loginTime": "2019-01-02T10:02:24.000+0000",
    //     "registTime": null,
    //     "updateTime": null,
    //     "userId": 100,
    //     "showFans": 1,
    //     展示粉丝列表（ 0： 展示、 1： 隐藏）
    // }

    data: {
        userId: -1, //用户（商家）id
        userInfo: {
            area: ''
        }, //用户信息
        attentionType: 0, //关注状态 0未关注 1已关注 2互相关注
        paddingTop: 0,
        currentTab: 0, //tab
        tabHeight: 0, //tab距离顶部距离
        fixed: false, //是否悬停
        freePage: 1,
        freeCourseList: [], //公开课列表
        firstSortValue: 0, //公开课列表第一个课程时间
        worth: 0, //价值     -1 全部      0免费     1收费
        freerefreshing: false, //是否正在刷新公开列表
    },

    onLoad: function(options) {
        this.setData({
            userId: options.userId
        })
        this.getPaddingTopFn();
        this.getUserInfo();
        this.getTabHeight();
        this.getFreeCourseInfo();
        if (app.judgeIsLogin()) {
            this.getAttentionType();
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        if (this.data.currentTab == 1) { //刷新精选课程
            this.selectComponent("#idSelected").refreshList();
        } else { //刷新公开视频
            this.setData({
                freePage: 1,
                freerefreshing: true,
            });
            this.getFreeCourseInfo()
        }
    },

    onPageScroll: function(e) {
        if (e.scrollTop > this.data.tabHeight) {
            this.setData({
                fixed: true
            })
        } else {
            this.setData({
                fixed: false
            })
        }
    },

    onReachBottom: function() {
        // 页面触底时执行
        if (this.data.currentTab == 0) { //公开列表 加载更多
            this.getFreeCourseInfo()
        } else if (this.data.currentTab == 1) { //精选课程 加载更多
            this.selectComponent("#idSelected").getData();
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(res) {
        if (res.from == 'menu') {
          ///首页视频流
          return {
            title: '热爱就要秀出来，这里有健身大咖的更多超清课程，快来观看啊～',
            path: 'pages/index/index',
            imageUrl: '/static/img/share_cover.png',
          }
        }
    },
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.page-header').boundingClientRect(function(rects) {
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
    },
    getUserInfo() { //获取用户信息
        let that = this;
        let data = {
            userId: this.data.userId,
            // fil:1
        }
        app.apiRequest(api.profileByUserId, data, "get").then(res => {
            if (res.data.code == 0) {
                that.setData({
                    userInfo: res.data.data,
                });
            } else {
                wx.showLoading({
                    title: JSON.stringify(res.data.code + ':' + res.data.message),
                    duration: 2000
                })
            }

        }).catch(error => {
            // handle error
            console.log("catch" + error.message)

        })
    },
    getAttentionType() { //获取关注状态
        let that = this;
        let data = {
            otherId: this.data.userId
        }
        app.apiRequest("/social/relation/relation", data, "get").then(res => {
            if (res.data.code == 0) {
                that.setData({
                    attentionType: res.data.data,
                });
            }
        })
    },
    getFreeCourseInfo() { //获取公开课程列表
        let that = this;
        let data = { //有商家号
            firstSortValue: this.data.firstSortValue,
            pageSize: 10,
            pageIndex: this.data.freePage,
            merchantId: this.data.userId,
            worth: this.data.worth
        };

        // data.fil = 1;

        //接口请求
        app.apiRequest(api.courseList, data, "get").then(res => {
            if (res.data.code == 0) {
                if (res.data.data == null || res.data.data.list == null || res.data.data.list.length <= 0) {
                    if (that.data.freerefreshing) {
                      wx.showLoading({
                        title: "刷新成功",
                        duration: 1000
                      })
                      this.onStopRefresh();
                    }
                    that.setData({
                      freerefreshing: false
                    })
                    return
                }
                if (that.data.freePage == 1) { //第一页数据
                    that.setData({
                        freeCourseList: res.data.data.list,
                    });
                    if (that.data.freerefreshing) {
                        wx.showLoading({
                            title: "刷新成功",
                            duration: 1000
                        })
                        this.onStopRefresh();
                    }
                } else { //非第一页数据
                    that.setData({
                        freeCourseList: that.data.freeCourseList.concat(res.data.data.list), //拼接list
                    });
                }
                that.setData({
                    firstSortValue: res.data.data.firstSortValue,
                    freePage: that.data.freePage + 1
                });
            } else {
                if (that.data.freerefreshing) {
                    wx.showLoading({
                        title: "刷新失败",
                        duration: 1000
                    })
                    this.onStopRefresh();
                } else {
                    wx.showLoading({
                        title: JSON.stringify(res.data.code + ':' + res.data.message),
                        duration: 2000
                    })
                }
            }
            that.setData({
                freerefreshing: false
            })
        }).catch(error => {
            // handle error
            console.log("catch" + error.message)
            that.setData({
                freerefreshing: false
            })
        })
    },
    getTabHeight() {
        let that = this
        let query = wx.createSelectorQuery()
        query.select(".merchant-tab-box").boundingClientRect(function(res) {
            // console.log(res)
            that.setData({
                //section header 距离 ‘当前顶部’ 距离
                tabHeight: res.top
            })
        }).exec()
    },
    switchTab(event) {
        this.setData({
            currentTab: event.target.dataset.currentTab
        })
    },
    attention: function(event) { //关注-取消关注
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let data = {
                    otherId: this.data.userId,
                    relation: this.data.attentionType == 0 ? 1 : 0
                }
                notification.postNotificationName("focus", { userId: data.otherId, relation:data.relation});
                app.apiRequest('/social/relation/h/focus', data, 'post').then(res => {
                    if (res.data.code == 0) {
                        this.setData({
                            attentionType: res.data.data
                        })
                    }
                })
            }
        })
    },
    onStopRefresh() {
        wx.stopPullDownRefresh(); //停止刷新
    }
})