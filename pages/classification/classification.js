// pages/classification/classification.js
const app = getApp();
const timeD = require("../../utils/util.js");
import inter from '../../utils/api'

import cryptoJs from '../../utils/crypto.js';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        currentTabActive: 0,
        tabListL: [],
        paddingTop: 0,

        dataList: [],
        videoList: [],
        followIdArr: [], // 关注商家id数组
        getfollowIdArr: [], // 后台获取列表存储数据
        classifyId: '', // tab栏中选中id
        hideDownBox: false,
        _index: undefined, // 点击封面记录视频id
        playVideoIndex: undefined, // 点击封面记录视频id
        courseId: '',
        classifyIndex: 0, // 上次请求分类数据最后一个课程指针

        previousClassifyId: 0,

        dataMap:{},

        currentUserId: wx.getStorageSync('userInfo').userId,
        tabClickFlag: true,
        topNum: -1,

        gotoFullScreen:false,
        scrollTop: 0, // 滚动高度
        sonClickGetScrollTop: 0, // 子组件点击之后获取高度
        scrollSpace : 0,///scrollView滚动距离(控制未登录弹框)


        judgeIsLoginFlag: false,

        tapScrollTopMap: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.getPaddingTopFn();
        this.setData({
            hideDownBox: false
        })
        // 统计
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '分类_访问',
        });
        // 
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        if (app.judgeIsLogin() && !this.data.tabListL.length) {
            this.getClassify(); // 获取分类列表
            this.setData({
                judgeIsLoginFlag: true
            })
        } else if (!app.judgeIsLogin() && !this.data.tabListL.length) {
            this.getClassify(); // 获取分类列表
        }
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {
        this.selectComponent("#videoList").videoPlay({
            currentTarget: {
                dataset: {
                    index: -1,
                }
            }
        })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        // this.getData(this.data.classifyId)
    },
    // 上拉加载
    scrolltolower() {
        // this.getData(this.data.classifyId)
        if (app.judgeIsLogin()) {
            this.getData(this.data.classifyId)
            return;
        }
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                this.getClassify()
            }
        })
    },
    // 子组件 收藏,点赞 触发登录 成功回调
    onLoginSuccess() {
        this.getClassify(); // 获取分类列表
    },
    // 数据加载
    getData: function(classifyId, switchTab, inRetry) {
        this.setData({
            tabClickFlag: true
        })
        if (switchTab && this.data.dataMap[classifyId] !== undefined && this.data.dataMap[classifyId].length != 0){
            this.setData({
                classifyId: classifyId,
                videoList: this.data.dataMap[classifyId]
            });
            return;
        }
        if (switchTab){
            this.setData({
                topNum: 0
            });
        }
        
        wx.hideLoading();
        wx.showLoading({
            title: '请耐心等待',
        })
        let data = {
            // fil: 1,
            pageSize: 15,
            classifyId: classifyId, // 分类id
            classifyIndex: this.data.classifyIndex, // 上次请求分类数据最后一个课程指针
            courseId: this.data.courseId ? this.data.courseId : ''
        };
        app.apiRequest('/search/foreign/course/classifyCourse', data, 'post').then(res => {
            if (res.data.code == 0) {
                let list = res.data.data.courseInfo;
                if (list.length == 0) {
                    if (!inRetry){
                        this.getData(classifyId, switchTab, true) // 如果没有数据递归
                    }
                    wx.hideLoading();
                    wx.showToast({
                        icon: 'none',
                        title: '该分类下无更多视频啦～',
                        duration: 2000
                    })
                    // return;
                }
                list.forEach((ele, i) => {
                    ele.video.transcodeUrl = cryptoJs.decrypt(ele.video.transcodeUrl ? ele.video.transcodeUrl : '')
                })

                if (this.data.classifyId == classifyId) {
                    //分页
                    let newList = this.data.videoList.concat(list);
                    this.setData({
                        videoList: newList
                    });
                    this.data.dataMap[classifyId]=newList
                } else {
                    //切标签
                    this.setData({
                        classifyId: classifyId,
                        videoList: list                        
                    });
                    this.data.dataMap[classifyId] = list
                }
                // this.getMerchantId();
                // 将子组件暂停
                this.selectComponent("#videoList").videoPlay({
                    currentTarget: {
                        dataset: {
                            index: -1,
                        }
                    }
                })
                if (this.data.videoList.length >= 215) {
                    this.setData({
                        videoList: this.data.videoList.splice(15)
                    })
                }
                wx.hideLoading();
                
            } else {
                wx.hideLoading();
                // wx.showToast({
                //     title: res.data.message,
                //     duration: 3000
                // })
            }
        }).catch(err => {
            wx.hideLoading();
        });
    },
    getMerchantId() {
        this.setData({
            followIdArr: []
        })
        let followIdArr = this.data.followIdArr;
        this.data.videoList.forEach(ele => {
            followIdArr.push(ele.merchant.id);
        })
        // this.getFollow(this.data.followIdArr)
    },
    // 获取分类列表
    getClassify() {
        app.apiRequest('/course/classify/list', null, 'get').then(res => {
            if (res.data.code == 0) {
                let result = res.data.data;
                let classItem = null;
                let classIndex = 0;
                if (this.data.lastActiveClassifyId) {
                    result.forEach((ele, i) => {
                        if (ele.classifyId == this.data.lastActiveClassifyId) {
                            classItem = result[i];
                            classIndex = i;
                        }
                    })
                }
                if (!classItem) {
                    classItem = result[0];
                }
                this.setData({
                    tabListL: result,
                    classifyId: classItem ? classItem.classifyId : ''
                });
                let tabE = {
                    currentTarget: {
                        dataset: {
                            index: classIndex,
                            item: {
                                name: classItem ? classItem.name : '',
                                classifyId: classItem ? classItem.classifyId : ''
                            }
                        }
                    }
                }
                this.tipItemBtn(tabE);
                // this.getData(result[0] ? result[0].classifyId : '',true);
                // 统计
                wx.reportAnalytics('classify_switchtab', {
                    classifyname: classItem ? classItem.name : ''
                });
            } else {
                wx.showToast({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
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
                    getfollowIdArr: res.data.data
                })
                let followInfo = res.data.data;
                this.data.videoList.forEach((ele, index) => {

                    res.data.data.forEach((e, i) => {
                        if (e.otherId == ele.merchant.id) {
                            ele.user = e;
                            if (e.otherId == this.data.currentUserId) {
                                ele.user.relation = 3;
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
        wx.createSelectorQuery().selectAll('.classification').boundingClientRect(function(rects) {
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
    },
    // 点击下拉按钮时
    downLoadMore() {
        if (this.data.hideDownBox) { // true
            this.setData({
                hideDownBox: false
            });
        } else { // false
            this.setData({
                hideDownBox: true
            });
        }
    },
    // 下拉tab栏点击事件
    tipItemBtn(e) {
        if (!this.data.tabClickFlag) {
            wx.showToast({
                title: '请耐心等待',
                duration: 4000
            })
            return;
        }
        this.selectComponent("#videoList").videoPlay({
            currentTarget: {
                dataset: {
                    index: -2,
                }
            }
        })
        this.setData({
            tabClickFlag: false
        })
        let index = e.currentTarget.dataset.index;
        let name = e.currentTarget.dataset.item.name;
        let classifyId = e.currentTarget.dataset.item.classifyId;
       
        let ele = this.data.tapScrollTopMap.find(item => {
            return item.classifyId == classifyId;
        });
        if (!ele) {
            this.data.tapScrollTopMap.push({ 'classifyId': classifyId, 'activeTapScrollTopNum': 0, 'name': name })
        }
        this.setData({
            tapScrollTopMap: this.data.tapScrollTopMap
        })
        this.data.tapScrollTopMap.length != 0 && this.data.tapScrollTopMap.forEach((ele, i) => {
            if (ele.classifyId == classifyId && ele.activeTapScrollTopNum) {
                this.setData({
                    topNum: ele.activeTapScrollTopNum
                })
            } else if (ele.classifyId == classifyId && ele.activeTapScrollTopNum == 0) {
                this.setData({
                    topNum: 0
                })
            }
        })
        console.log(this.data.tapScrollTopMap)

        this.setData({
            lastActiveClassifyId: classifyId,
            currentTabActive: index > 3 ? 0 : index
        })
        // 统计
        wx.reportAnalytics('classify_switchtab', {
            classifyname: name,
        });
        if (index <= 3) {
            this.getData(classifyId, true);
            this.setData({
                hideDownBox: false
            });
            return;
        }
        var item;
        this.data.tabListL.forEach((ele, i) => {
            if (ele.classifyId == classifyId) {
                item = ele;
                this.data.tabListL.splice(i, 1);
                this.data.tabListL.unshift(item);
                this.setData({
                    tabListL: this.data.tabListL
                }, () => {
                    this.getData(this.data.tabListL[0].classifyId, true)
                })
            }
        })
        this.setData({
            hideDownBox: false
        });
        if (!app.judgeIsLogin()) return;
        app.apiRequest('/course/classify/move', {
            classifyId: classifyId
        }, 'post').then(res => {
            if (res.data.code == 0) {

            } else {
                wx.showToast({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
    },
    // 下拉框的点击事件
    hideDownBox() {
        this.setData({
            hideDownBox: false
        });
    },
    // 转发 小程序 发送给朋友
    onShareAppMessage: function(res) {
        // 统计
        console.log(res)
        if (res.from === 'button') {
            // 来自页面内转发按钮
            let videoInfo = res.target.dataset.item;
            let courseId = videoInfo.course.id; //获取产品id
            let title = videoInfo.course.title; //获取产品标题
            let cover = videoInfo.video.cover; //产品图片
            wx.reportAnalytics('classification_share', {});
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
    },
    // 子组件触发的事件
    videoPlay() {
        this.data.sonClickGetScrollTop = this.data.scrollTop;

        // console.log(this.data.scrollTop)
    },
    // 获取滚动条当前位置
    scrolltoupper: function(e) {
        let orignalTop = this.data.scrollTop
        this.data.scrollTop = e.detail.scrollTop;
        ///ios 解决全屏回来错位问题
        if (app.getPhoneType()==1){
          if(this.data.gotoFullScreen && this.data.scrollTop == 0){
            this.setData({
              topNum: orignalTop
            })
            this.data.gotoFullScreen = false
            return
          }
        }

        console.log("scrollview滚动距离了 ",this.data.scrollTop)
        this.data.tapScrollTopMap.forEach((ele, i) => {
            if (ele.classifyId == this.data.lastActiveClassifyId) {
                ele.activeTapScrollTopNum = e.detail.scrollTop
            }
        });

        this.setData({
            tapScrollTopMap: this.data.tapScrollTopMap,
            scrollTop:this.data.scrollTop
        })

        if ((Math.abs(this.data.scrollTop - this.data.sonClickGetScrollTop)) > 1140) {
            // 将子组件暂停
            this.selectComponent("#videoList").videoPlay({
                currentTarget: {
                    dataset: {
                        index: -2,
                    }
                }
            })
        }
        ///滚动两个video 弹登录
        if(!app.judgeIsLogin()){
            if (this.data.scrollTop == 0) {
                this.data.scrollSpace = 0
            } else {
                if (this.data.scrollTop - this.data.scrollSpace > 600) {
                    this.data.scrollSpace = this.data.scrollTop
                    //to do 
                    app.showLoginMask(this, "#login", null)
                } else if (this.data.scrollTop - this.data.scrollSpace < -600){
                    this.data.scrollSpace = this.data.scrollTop
                }
            }
        }
    },
    ///监听播放器的横竖屏
    screenChange (e) {
      let topNum = this.data.scrollTop
      let fullScreen = e.detail.detail.fullScreen //值true为进入全屏，false为退出全屏
      if (app.getPhoneType()==1){
        if (fullScreen) {
          this.data.gotoFullScreen = true
        }
      }else {
        this.data.gotoFullScreen = fullScreen
      }

    },
    // onTabItemTap(item) {
    //     if (!app.judgeIsLogin()) { // 未登录
    //         wx.setStorageSync('needLogin', true)
    //         wx.switchTab({
    //             url: '/pages/index/index'
    //         })
    //     }
    // }
    
})