import regeneratorRuntime from '../../../utils/runtime';
const app = getApp();
import api from '../../../api/api';
var initData = {};

Page({
  data: {
    firstIn:true,
    headerHeight: 0,
    courseListTitieActiveIndex: 0,
    courseListPznLeft: 0,
    showFixedTab: '',
    showList: 0,
    needShowRefreshToash: false,
    isIPhone : true,
    showPopBg: '',
    showPop: '',
    userInfo: null,
    userIntroducingInfo: null,
    getThumbCount: 0,
    couponCount: 0,
    lowerCount: 0,
    likeList: [],
    likePageIndex: 1,
    favList: [],
    favPageIndex: 1,
    followList: [],
    followPageIndex: 1
  },
  onLoad: function() {
    this.getHeaderHeight();
    initData = JSON.parse(JSON.stringify(this.data))
    this.initData()
    this.init();  
  },

  onShow() {
    this.getHeaderHeight();
    if(!this.data.firstIn){
      if (this.data.userInfo == null) {///没有数据
        this.initData()
        this.init()
      } else if (!app.judgeIsLogin()) {//有数据,退出登录了
        this.getHeaderHeight();
        this.resetData()
        this.initData()
      }
    }
    this.data.firstIn = false
  },
  login() {
    !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
      triggertime: 0,
      triggeraddress: '我的_点击登录',
    });

    let _this = this;
    app.checkLogin(this, '#login').then(r => {
      r.code == 3 && _this.init();
    })
  },
  ///清除数据
  resetData() {
    this.setData(initData)
  },
  initData(){
    this.setData({
      isIPhone: app.getPhoneType() == 1
    })
    this.data.likePageIndex = 1;
    this.data.favPageIndex = 1;
    this.data.followPageIndex = 1;
    this.data.likeList = [];
    this.data.favList = [];
    this.data.followList = [];
  },
  init() {
    if (!app.judgeIsLogin()) return
    this.getThumbCount()
    !this.data.isIPhone && this.getCouponCount()
    this.getUserInfo()
    this.getInvitedCount();
    this.myThumbList();
    this.myCollectList()
    this.focuses()
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
        });
    },
    ///获取用户信息
    getUserInfo() {
        app.apiRequest(api.profileByUserId, {
            userId: wx.getStorageSync('userInfo').userId,
            // fil: 1
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                wx.setStorageSync('USERINFO', r.data.data);
                this.setData({
                    userInfo: r.data.data
                });
            }
        }).catch(err => {});
    },
    //获取点赞数量
    getThumbCount() {
        app.apiRequest("/course/opt/thumbCount", {}, 'GET').then(r => {
            if (r.data.code == 0) {
                this.setData({
                    getThumbCount: r.data.data
                });
            }
        }).catch(err => {});
    },
    ///获取优惠券数量
    getCouponCount() {
        app.apiRequest("/coupon/enroll/couponCount", {}, 'GET').then(r => {
            if (r.data.code == 0) {
                this.setData({
                    couponCount: r.data.data
                });
            }
        }).catch(err => {});
    },
    // 邀请好友数量
    getInvitedCount() {
        app.apiRequest(api.getInvitedCount, {}, 'GET').then(r => {
            if (r.data.code == 0) {
                this.setData({
                    lowerCount: r.data.data.lowerCount
                });
            }
        }).catch(err => {});
    },

    // 点赞列表
    myThumbList() {
        app.apiRequest(api.myThumbList, {
            // fil: 1,
            pageIndex: this.data.likePageIndex,
            pageSize: 20
        }, 'GET').then(r => {
            this.refreshSuccess(this.data.likePageIndex)
            if (r.data.code == 0) {
                if (this.data.likePageIndex == 1) {
                    this.setData({
                        likeList: r.data.data
                    });
                } else {
                    this.setData({
                        likeList: this.data.likeList.concat(r.data.data)
                    });
                }
            }
        }).catch(err => {
            this.refreshFail(this.data.likePageIndex)
        });
    },

    // 关注列表
    focuses() {
        app.apiRequest(api.focuses, {
            pageIndex: this.data.followPageIndex,
            pageSize: 20,
            otherId: wx.getStorageSync('userInfo').userId
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                if (this.data.followPageIndex == 1) {
                    this.setData({
                        followList: r.data.data
                    });
                } else {
                    this.setData({
                        followList: this.data.followList.concat(r.data.data)
                    });
                }
            }
            this.refreshSuccess(this.data.followPageIndex)
        }).catch(err => {
            this.refreshFail(this.data.followPageIndex)
        });
    },

    // 收藏列表
    myCollectList() {
        app.apiRequest(api.myCollectList, {
            // fil: 1,
            pageIndex: this.data.favPageIndex,
            pageSize: 20
        }, 'GET').then(r => {
            if (r.data.code == 0) {
                if (this.data.favPageIndex == 1) {
                    this.setData({
                        favList: r.data.data
                    });
                } else {
                    this.setData({
                        favList: this.data.favList.concat(r.data.data)
                    });
                }
            }
            this.refreshSuccess(this.data.favPageIndex)
        }).catch(err => {
            this.refreshFail(this.data.favPageIndex)
        });
    },
    toSetup() {
        wx.navigateTo({
            url: '../setup/index'
        });
    },
    switchTab(e) {
        let index = e.currentTarget.dataset.index - 0
        this.setData({
            showList: index
        });
        if (!app.judgeIsLogin()) return
        switch (index) {
            case 0:
                if (this.data.likeList.length == 0) {
                    this.myThumbList()
                }
                break
            case 1:
                if (this.data.favList.length == 0) {
                    this.myCollectList()
                }
                break
            case 2:
                if (this.data.followList.length == 0) {
                    this.focuses()
                }
                break
            default:
        }
    },
    onPullDownRefresh() {
        this.data.needShowRefreshToash = true
        if (!app.judgeIsLogin()) {
          this.refreshSuccess(this.data.likePageIndex)
          return
        }
        this.getInvitedCount()
        this.getThumbCount()
        this.getCouponCount()
        this.refreshRequestData()
    },
    onReachBottom() {
        if (!app.judgeIsLogin()) return
        if (this.data.showList == 0) {
            this.data.likePageIndex += 1;
            return this.myThumbList();
        }

        if (this.data.showList == 1) {
            this.data.favPageIndex += 1;
            return this.myCollectList();
        }

        if (this.data.showList == 2) {
            this.data.followPageIndex += 1;
            return this.focuses();
        }
    },
    refreshRequestData() {
        if (!app.judgeIsLogin()) return
        if (this.data.showList == 0) {
            this.data.likePageIndex = 1;
            return this.myThumbList();
        }

        if (this.data.showList == 1) {
            this.data.favPageIndex = 1;
            return this.myCollectList();
        }

        if (this.data.showList == 2) {
            this.data.followPageIndex = 1;
            return this.focuses();
        }
    },
    stopRefresh() {
        this.data.needShowRefreshToash = false
        wx.stopPullDownRefresh()
    },
    refreshSuccess(page) {
        if (page != 1) return
        if (!this.data.needShowRefreshToash) return
        this.stopRefresh()
        wx.showToast({
            title: '刷新成功',
        })
    },
    refreshFail(page) {
        if (page != 1) return
        if (!this.data.needShowRefreshToash) return
        this.stopRefresh()
        wx.showToast({
            title: '刷新失败',
        })
    },
    myCouponTap() {
        if (!app.judgeIsLogin()) {
            return wx.showToast({
                title: '请登录后再查看',
                icon: 'none'
            });
        }
        wx.navigateTo({
            url: '/pages/my/coupon/index',
        })
    },
    toInvited() {
        if (!app.judgeIsLogin()) {
            return wx.showToast({
                title: '请登录后再查看',
                icon: 'none'
            });
        }
        wx.navigateTo({
            url: '/pages/my/invited/index'
        });
    },
    openPop() {
        if (!app.judgeIsLogin()) {
            return wx.showToast({
                title: '请登录后再查看',
                icon: 'none'
            });
        }
        this.setData({
            showPopBg: 'show',
            showPop: 'show'
        }, function() {
            this.setData({
                showPopBg: 'show opacity',
                showPop: 'show zoom-in'
            });
        });
    },

    closePop() {
        this.setData({
            showPopBg: 'show',
            showPop: 'show zoom-out'
        }, function() {
            setTimeout(() => {
                this.setData({
                    showPopBg: '',
                    showPop: ''
                });
            })
        })
    },
    toBalance() { //跳转余额
        if (!app.judgeIsLogin()) return
        wx.navigateTo({
            url: "/pages/my/brokerage/brokerage"
        });
    }
})