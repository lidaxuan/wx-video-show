import regeneratorRuntime from '../../../utils/runtime';
const app = getApp();
import api from '../../../api/api';

Page({
    data: {
        headerHeight: 0,
        courseListTitieActiveIndex: 0,
        courseListPznLeft: 0,
        showFixedTab: '',
        showList: 0,
        showPopBg: '',
        showPop: '',
        userId: null,
        userInfo: null,
        likeList: null,
        followList: null,
        isFollowed: false,
        needShowRefreshToash:false
    },

    onLoad: function(options) {
        this.data.userId = options.userid;
        this.requestServerData()
    },
    onShow:function() {
      this.getHeaderHeight();
    },
    stopRefresh() {
      this.data.needShowRefreshToash = false
      wx.stopPullDownRefresh()
    },
    onPullDownRefresh() {
      console.log("下拉刷新了")
      this.data.needShowRefreshToash = true
      this.requestServerData()
    },
    requestServerData(){
        console.log("请求数据了")
        this.requestUserInfo()
        this.myThumbList();
        this.focuses();
        this.relation();
    },
    refreshSuccess(page) {
        if (!this.data.needShowRefreshToash) return
        this.stopRefresh()
        wx.showToast({
          title: '刷新成功',
        })
    },
    //用户信息
    requestUserInfo(){
        app.apiRequest(api.profileByUserId, {
          userId: this.data.userId,
          // fil : 1
        }, 'GET').then(r => {
          if (r.data.code == 0) {
            this.setData({
              userInfo: r.data.data
            });
          }
        }).catch(err => { });
    },
    // 点赞列表
    myThumbList() {
        app.apiRequest(api.myThumbList, {
            // fil: 1,
            pageIndex: 1,
            pageSize: 20,
            userId: this.data.userId
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                this.setData({
                    likeList: r.data.data
                });
            }
            this.refreshSuccess()
        }).catch(err => {
          this.stopRefresh()
        });
    },

    // 关注列表
    focuses() {
        app.apiRequest(api.focuses, {
            pageIndex: 1,
            pageSize: 20,
            otherId: this.data.userId
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                this.setData({
                    followList: r.data.data
                });
            }
            this.refreshSuccess()
        }).catch(err => {
          this.stopRefresh()
        });
    },

    async getHeaderHeight() {
        let h = await app.getElementHeight('.header');
        this.setData({
            headerHeight: h
        }, this.fixTabBar);
    },

    async fixTabBar() {
        let topBarHeight = await app.getElementHeight('.tab-box');
        wx.createIntersectionObserver().relativeToViewport({
            top: 0 - this.data.headerHeight - topBarHeight
        }).observe('.tab-box', (r) => {
            this.setData({
                showFixedTab: r.intersectionRect.height == 0 ? 'show' : ''
            });
        })
    },

    switchTab(e) {
        this.setData({
            showList: e.currentTarget.dataset.index
        });
    },

    relation() {
        if(!app.judgeIsLogin()) return
        app.apiRequest(api.relation, {
            otherId: this.data.userId
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                if (r.data.data != '0') {
                    this.setData({
                        isFollowed: true
                    });
                }
            }
        }).catch(err => {});
    },

    follow() {
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '用户主页_关注',
        });

        wx.showLoading({
            title: '请稍候'
        });

        app.apiRequest(api.focus, {
            otherId: this.data.userId,
            relation: this.data.isFollowed ? 0 : 1,
            ftype: 0
        }).then(r => {
            wx.hideLoading();
            
            if (r.data.code == 0) {
                wx.showToast({
                    title: this.data.isFollowed ? '取消成功' : '关注成功',
                });

                return this.setData({
                    isFollowed: !this.data.isFollowed
                });
            }
            
            return wx.showToast({
                title: '操作失败，请稍后再试',
                icon: 'none'
            });
        }).catch(err => {});
    }
})