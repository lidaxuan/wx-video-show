// pages/course/courseInfo.js
import cryptoJs from '../../../utils/crypto.js';
import api from '../../../api/api';
import inter from '../../../utils/api'
import utils from "../../../utils/util.js";
var notification = require('../../../components/WxNotificationCenter/WxNotificationCenter.js')

const app = getApp();

Page({
    //当前页数据缓存
    pageCache:{
      tempData:null,
      opentions :null
    },
    /**
     * 页面的初始数据
     */
    data: {
        courseId: undefined,
        businessInfo: {
            logo: '',
        },
        briefVisible: false, // 简介弹窗
        pageIndex: 1, //请求页数
        pageSize: 10, //请求条数
        lessonList: [], //目录信息
        totalLesson: 0, //总节数
        existC: 1, //是否存在章节
        courseInfo: {}, //课节信息
        isFree: undefined, //是否是免费课程
        learnStatus: undefined, //学习状态
        isBuy: false, //已购买或者已学习
        isShelf: true, //是否下架    
        merchantData: {}, //商家信息
        relationStatus: false, //// 用户与商家之间的关注关系
        activeFollow: undefined,
        followText: '关注',
        authInstitute: [], //认证机构
        lecturerList: [], //讲师
        courseIntroduce: {}, //课程简介     
        brief: false, //是否有简介
        loadFinish: false, //是否加载完成
        videoPlayUrl: undefined, //视频播放地址
        poster: '', //封面
        operateInfo: {
            thumbCount: undefined, //获赞数
            collectCount: undefined, //收藏数
            shareCount: undefined, //收藏数
        },
        lecturerShow: false,
        defaultNumber: 5, //默认显示讲师
        playActive: undefined, //播放状态
        currentSection: 1, //当前播放节
        newLessonArr: [], //只包含节数据
        freePlayCover: false, //试看结束弹窗
        loadError: false, //网络错误
        coverVisible: true, //课程封面
        userInfo: undefined,
        guideVisible: false, //引导弹窗
        collectState: 0, //收藏状态
        thumbState: 0, //点赞状态
        freeSection: 1, //试看节数
        freeMin: 0, //试看分钟
        videoTitle: null, //视频标题
        showCardModal: false, //海报弹窗
        hideModal: true, //模态框的状态  true-隐藏  false-显示
        shareImage: '', // 生成海报图片
        animationData: {}, // 动画集
        painting: {}, // 海報
        wxQrcode: '', // 分享的二维码
        qrCodeUrl: '',
        enterFullScreen: false, //是否是全屏
        saveBtnVisible: false, //保存按钮
        paddingTop: 0,
        videoHeight: 0,
        imgDrawing: false, // 海报是否生成成功
        couponData: false, //优惠券
        couponBtn: true, //抢光按钮
        couponVisible: false, //优惠券弹窗
        couponBtnText: '立即抢', //优惠券按钮文本
        couponId: undefined,
        couponBtnFlag: true, //默认让领取优惠券
        btnRemove: true, //立即购买按钮
        countTimes: '00:00:00', //倒计时时间  
        isIos: false,
        reMarkHeight:298,
        needRefreshReqeust :false,

        isCerPopup: false, //了解详情弹窗以及查看领取证书弹窗
        isHighCourse: false, //高级课程弹窗
        examStatus: 0, //bar状态
        highCoursePopup: {
          type: 1,
          highCourseId: '',
          highCourseName: ''
        }, //高级课程弹窗显示文案
        examCountDown: '',
        isRealNameAuth: false, //实名认证弹窗
        isExamTip: false, //开始考试弹窗
        iconLqCoupon:false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var _this = this;
        _this.setData({
            isIos: app.getPhoneType() == 1
        })
        if (options.courseId) {
            _this.setData({
                courseId: options.courseId
            })
            app.globalData.buyCourseNeed.courseId = options.courseId;
        } else if (app.globalData.buyCourseNeed.courseId) {
            _this.setData({
                courseId: app.globalData.buyCourseNeed.courseId
            })
        }
        if (options.upperId) {
            app.globalData.upperId = options.upperId;
            app.globalData.buyCourseNeed.upperId =options.upperId;
        } else if (app.globalData.buyCourseNeed.upperId) {
            _this.setData({
                upperId: app.globalData.buyCourseNeed.upperId
            })
        }

        // 首页 普通模式进来 存数据 --------- 玄
        if (options.courseId && options.upperId) {

            let bindingPhoneParam = {
                upperId: options.upperId,
                courseId: options.courseId
            }
            wx.setStorageSync('bindingPhoneParam', bindingPhoneParam);
            wx.setStorageSync('buyCourseNeed', bindingPhoneParam);
        }

        // 首页 扫描二维码进入  --------- 玄
        if (options.scene && options.scene.indexOf('%2C') != -1) {
            var arr = options.scene.split('%2C');
            _this.setData({
                courseId: arr[0]
            })

            app.globalData.courseId = arr[0];
            // app.globalData.buyCourseNeed.courseId = arr[0];
            // app.globalData.buyCourseNeed.upperId = arr[1];
            // ---------------------------同上 --------- 玄
            let bindingPhoneParam = {
                upperId: arr[1],
                courseId: arr[0]
            }
            wx.setStorageSync('bindingPhoneParam', bindingPhoneParam);
            wx.setStorageSync('buyCourseNeed', bindingPhoneParam);
        }
        this.pageCache.temData = JSON.parse(JSON.stringify(this.data));
        this.pageCache.opentions = options;
        !app.judgeIsLogin() && wx.reportAnalytics('visitors_visitapplet', {});

        this.loginAfter();
        wx.removeStorageSync('goH5Page');
        wx.removeStorageSync('examFinishParam');
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.getPaddingTopFn();
        if (wx.getStorageSync('buyReturn')){  //支付返回
            wx.removeStorageSync('buyReturn');
        }

        var _this = this;
        if (wx.getStorageSync('goH5Page')) {
          wx.removeStorageSync('goH5Page');
          if (wx.getStorageSync('examFinishParam').upperCid) {
            _this.setData({
              isHighCourse: true,
              ['highCoursePopup.highCourseName']: wx.getStorageSync('examFinishParam').upperCourse,
              ['highCoursePopup.highCourseId']: wx.getStorageSync('examFinishParam').upperCid,
              ['highCoursePopup.type']: 2,
            })
          }
          wx.removeStorageSync('examFinishParam');
        }

        if (this.data.needRefreshReqeust){
            this.loginAfter();
        }
        this.data.needRefreshReqeust = true
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (!this.data.loadFinish) {
            wx.showLoading({
                title: '加载中',
            })
            this.getCourseLesson();
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (res) {
        this.data.needRefreshReqeust = false
        if (res.from === 'button') {
            // 来自页面内转发按钮
            // 统计
            wx.reportAnalytics('featured_share', {});
            let courseParam = this.data.courseInfo;
            let courseId = courseParam.id; //获取产品id
            let title = courseParam.title; //获取产品标题
            let cover = courseParam.cover; //产品图片
            var upperId = '';
            if (wx.getStorageSync('userInfo').userId) {
              upperId = '&upperId=' + wx.getStorageSync('userInfo').userId;
            }
            if (app.judgeIsLogin()) {
              inter.inter.shareFn(courseId); // 调用分享接口
            }
            return {
                title: title,
                path: '/pages/course/courseInfo/courseInfo?courseId=' + courseId + upperId,
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
    onLoginSuccess() {

    },
    init() {
        this.getCourseInfo(); //获取单个课程信息
        this.getMerchant(); //获取商家信息
        this.getAttrInfo(); //获取讲师、认证机构信息
        this.getCourseIntroduce();
        this.operateInfo();
        if (!this.data.isIos) {
            this.getAdCoupon(); //获取优惠券
        }
    },
    briefShow() {   //简介弹窗
        if (!this.data.briefVisible){
            this.setData({
                reMarkHeight: wx.getSystemInfoSync().windowHeight - this.data.paddingTop - this.data.videoHeight - 80
            })
        }
        this.setData({
            briefVisible: !this.data.briefVisible
        })
    },
    getCourseLesson() { //获取课程列表
        let data = {
            courseId: this.data.courseId,
            pageIndex: this.data.pageIndex,
            pageSize: this.data.pageSize,
        }
        app.apiRequest('/course/cert/lessons', data, 'get').then(res => {
            wx.hideLoading();
            if (res.data.code == 0) {
                if (app.judgeIsLogin()) { //登录的情况下
                    if (!this.data.isBuy) { //未购买的情况下
                        if (this.data.courseInfo.lessonCon == 1) {
                            this.setData({
                                freeSection: 1,
                                freeMin: 60
                            })
                        } else if (this.data.courseInfo.lessonCon <= 20 && this.data.courseInfo.lessonCon>1) {
                            this.setData({
                                freeSection: 1
                            })
                        } else if (this.data.courseInfo.lessonCon > 20) {
                            this.setData({
                                freeSection: 4
                            })
                        }
                    } else {
                        this.setData({
                            freeSection: this.data.courseInfo.lessonCon
                        })
                    }
                } else { //未登录情况下
                    if (this.data.courseInfo.lessonCon == 1) {
                        this.setData({
                            freeMin: 60
                        })
                    } else if (this.data.courseInfo.lessonCon > 20) {
                      this.setData({
                        freeSection: 4
                      })
                    }
                }
                let resDataLens = res.data.data.rows.length;
                let listDataLens = this.data.lessonList.length;
                let lessonTotal = 0;
                let _this = this;
                if (resDataLens > 0) {
                    res.data.data.rows.forEach(function (currentValue, index, arr) {
                        if (res.data.data.existC == 1) { //存在章的话
                            lessonTotal += currentValue.lessons.length;
                            _this.data.newLessonArr = _this.data.newLessonArr.concat(currentValue.lessons)
                        } else {
                            lessonTotal = resDataLens;
                            _this.data.newLessonArr = _this.data.newLessonArr.concat(currentValue);
                        }
                    })
                }
                if (lessonTotal < this.data.pageSize) {
                    this.setData({ //数据加载完成
                        loadFinish: true
                    })
                }
                if (res.data.data.existC == 1 && this.data.pageIndex > 1 && resDataLens > 0) { //存在章的情况下
                    if (this.data.lessonList[listDataLens - 1].id == res.data.data.rows[0].id) {
                        this.data.lessonList[listDataLens - 1].lessons = this.data.lessonList[listDataLens - 1].lessons.concat(res.data.data.rows[0].lessons);
                        res.data.data.rows = res.data.data.rows.splice(1, 1);
                    }
                }
                this.data.pageIndex++;
                this.setData({
                    totalLesson: res.data.data.total,
                    existC: res.data.data.existC,
                    lessonList: this.data.lessonList.concat(res.data.data.rows)
                })
            }
        }).catch(error => {
            wx.hideLoading();
        })
    },
    getCourseInfo() { //获取单个课程信息
        let data = {
            courseId: this.data.courseId,
            // fil:1
        }
        app.apiRequest('/course/cert/one', data, 'get').then(res => {
            let resData = res.data;
            if (resData.code == 0) {
                this.setData({
                    courseInfo: resData.data,
                    poster: resData.data.cover,
                    videoTitle: resData.data.title
                })
                if (app.judgeIsLogin()) { //登录的情况下
                    this.getLearnStatus();
                } else {
                    this.getCourseLesson();
                }

                if (resData.data.cfType == 1) { //免费课程
                    this.setData({
                        isFree: 1
                    })
                }
                if (this.data.courseInfo.status == 1) { //课程下架的情况下
                    this.setData({
                        isShelf: false
                    })
                }
            }
        }).catch(error => {

        })
    },
    getCourseIntroduce() { //获取课程信息
        let data = {
            courseId: this.data.courseId
        }
        app.apiRequest('/course/getCourseIntroduce', data, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    courseIntroduce: res.data.data,
                })
                if (res.data.data.remark) { // 有课程介绍 展示简介
                    this.setData({
                        brief: true,
                    })
                    this.data.courseIntroduce.remark = res.data.data.remark;
                }
            }
        }).catch(error => {

        })
    },
    getLearnStatus() { //获取学习进度
        app.apiRequest('/course/learn/status', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    isBuy: true, //已购买或者已学习
                    learnStatus: res.data.data
                })
                let resData = res.data.data;
                let examStatus = 0;

                if (this.data.courseInfo.type == 2) { //认证课程的情况下
                  if (resData.examStatus == 0) { //无资格考试
                    examStatus = 1;
                  } else if (resData.examStatus == 1 && resData.sttime) { //预计考试时间
                    examStatus = 2;
                  } else if (resData.examStatus == 1 && !resData.tatime && !resData.sttime) { //可以考试未考试
                    examStatus = 3;
                  } else if (resData.examStatus == 2) { //考试通过未领取证书
                    examStatus = 4;
                  } else if (resData.examStatus == 3 || resData.examStatus == 4) { //考试通过证书已领取
                    examStatus = 5;
                  } else if (resData.examStatus == 1 && resData.tatime) { //考试未通过倒计时
                    examStatus = 6;
                    let timeObj = utils.needBindingTimer(new Date().getTime(), resData.tatime, 0); //获取倒计时时间
                    let _this = this;
                    if (timeObj.show) {
                      let remainingTime = timeObj.time - 1000;
                      _this.setData({
                        examCountDown: remainingTime
                      })
                      var timer = setInterval(function () {
                        remainingTime = remainingTime - 1000
                        if (remainingTime <= 0) {
                          ///定时器结束
                          clearInterval(timer);
                          _this.setData({
                            examStatus: 3
                          })
                          return
                        }
                        _this.setData({
                          examCountDown: remainingTime
                        })
                      }, 1000)
                    }
                  } else {
                    examStatus = 0;
                  }
                  this.setData({
                    examStatus: examStatus
                  })
                }
            }
            this.getCourseLesson();
            if (this.data.courseInfo.status == 1) { //课程下架的情况下
                if (this.data.courseInfo.cfType == 2 && this.data.isBuy) { //付费已买课程可以观看
                    this.setData({
                        isShelf: true
                    })
                } else {
                    this.setData({
                        isShelf: false
                    })
                }
            }
        }).catch(error => {

        })
    },
    getAttrInfo() { // 获取讲师信息
        app.apiRequest('/course/cert/attrInfo', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                if (res.data.data.lecturerInfo) { //讲师
                    this.setData({
                        lecturerList: res.data.data.lecturerInfo,
                    })
                }
                if (res.data.data.authInstitute) { //认证机构
                    this.setData({
                        authInstitute: res.data.data.authInstitute
                    })
                }
            }
        }).catch(error => {

        })
    },
    getMerchant() { //获取商家信息
        app.apiRequest('/course/visitor/merchant', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    merchantData: res.data.data,
                })
                if (res.data.data.userId == wx.getStorageSync('userInfo').userId) {  
                    this.setData({
                        relationStatus: true
                    })
                }
                if (app.judgeIsLogin()) { //登录的情况下去请求
                    this.getRelationStatus();
                }
            }
        }).catch(error => {

        })
    },
    getRelationStatus() { // 查询用户对某人的关注状态
        app.apiRequest('/social/relation/status', {
            otherId: this.data.merchantData.userId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                if (!this.data.activeFollow) { //判断是否是点击关注
                    //关注返回true  ，未关注返回false
                    this.setData({
                        relationStatus: res.data.data,
                    })
                } else {
                    this.setData({
                        followText: "已关注",
                    })
                }
            }

        }).catch(error => {

        })
    },
    followBtn() { // 查询用户对某人的关注状态
        if (app.judgeIsLogin()) {  //登录的状态下
            app.apiRequest('/social/relation/h/focus', {
                otherId: this.data.merchantData.userId,
                relation: 1,
                ftype: 1
            }, 'get').then(res => {
                if (res.data.code == 0) {
                  console.log("开始发通知了")
                    notification.postNotificationName("focus", { userId: this.data.merchantData.userId, relation: 1 })
                    this.setData({
                        activeFollow: true,
                    })
                    this.getRelationStatus(); // 有商家信息进行操作
                } else if (res.data.code == 5005) {
                    this.setData({
                        activeFollow: true,
                    })
                }

            }).catch(error => {

            })
        } else {
            app.checkLogin(this, "#loginIn").then((res) => {
                if (res.code == 3) { //登录成功
                    this.loginAfter();
                }
            })
            wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '精选课详情_关注',
            });
        }
        
    },
    operateInfo() { //课程操作信息
        app.apiRequest('/course/cert/operateInfo', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    operateInfo: res.data.data,
                    collectState: res.data.data.collectState,
                    thumbState: res.data.data.thumbState
                })
            }

        }).catch(error => {

        })
    },
    mlNumber(numbers) {
      if (numbers.toString().length > 4) {
        numbers = Math.floor(parseInt(numbers) / 10000 * 10) / 10;
        if (numbers.toString().length == 1) {
          numbers = numbers + '.0';
        }
        numbers = numbers + "w";
      }
      return numbers;
    },
    videoPlay(e) { //点击目录开始播放
        app.checkLogin(this, "#loginIn").then((res) => {
            if(res.code == 3){
                var id = e.currentTarget.dataset.index;
                var videoUrl = e.currentTarget.dataset.url;
                this.setData({
                    freePlayCover: false
                })
                if (this.data.isBuy) {
                    this.setData({
                        btnRemove: false, //播放按钮消失
                    })
                }
                if (videoUrl) {
                    videoUrl = cryptoJs.decrypt(videoUrl ? videoUrl : '')
                    this.setData({
                        videoPlayUrl: videoUrl,
                        playActive: id,
                        currentSection: id,
                        coverVisible: false,
                        videoTitle: this.data.newLessonArr[id - 1].title,
                    })
                    var videoContext = wx.createVideoContext('myVideo');
                    videoContext.seek(0, 0);
                    videoContext.play();
        
                } else {
                    if (!app.judgeIsLogin() && id != 1) {
                        wx.reportAnalytics('triggerloginlayer', {
                            triggertime: 0,
                            triggeraddress: '精选课详情_尝试观看非第一个视频',
                        });
                        app.checkLogin(this, '#loginIn').then((res) => {
                            if (res.code == 3) {
                                this.loginAfter();
                            }
                        })
                    } else {
                        wx.showToast({
                            title: '查看更多视频，请下载秀健身APP',
                            icon: 'none',
                            duration: 3000
                        })
                    }
        
                }
            }
        })
    },
    nextSectionPlay() { //自动播放下一节
        var videoContext = wx.createVideoContext('myVideo');
        if (this.data.currentSection < this.data.freeSection) {
            this.data.currentSection++;
            let url = this.data.newLessonArr[this.data.currentSection - 1].transcodeUrl;
            if (url) {
                this.setData({
                    videoPlayUrl: cryptoJs.decrypt(url ? url : ''),
                    playActive: this.data.newLessonArr[this.data.currentSection - 1].no,
                    videoTitle: this.data.newLessonArr[this.data.currentSection - 1].title,
                })
                videoContext.seek(0, 0);
                videoContext.play();
            }
        } else {
            if (this.data.currentSection == this.data.freeSection) { //播放到最后一节的时候
                this.setData({
                    coverVisible: true
                })
            }
            if (!this.data.isBuy) {
                this.setData({
                    freePlayCover: true,
                })
            }
            if (this.data.enterFullScreen) { //全屏情况下关闭全屏
                videoContext.exitFullScreen()
            }
        }
    },
    lecturerMore() {
        this.setData({
            lecturerShow: !this.data.lecturerShow,
            defaultNumber: this.data.defaultNumber == 5 ? this.data.lecturerList.length : 5
        })
    },
    bindended() { //结束播放
        this.nextSectionPlay();
    },
    binderror() { //视频播放出错
        this.setData({
            loadError: true
        })
    },
    bindfullscreenchange(fullScreen, direction) { //进入全屏之后
        this.setData({
            enterFullScreen: fullScreen.detail.fullScreen
        })
    },
    beginPlay() { //点击播放器上面封面播放按钮
        app.checkLogin(this, "#loginIn").then((res)=>{
            if (res.code == 3) {
                let url = this.data.newLessonArr[this.data.currentSection - 1].transcodeUrl;

                this.setData({
                    coverVisible: false,
                    videoPlayUrl: cryptoJs.decrypt(url ? url : ''),
                    playActive: this.data.newLessonArr[this.data.currentSection - 1].no,
                    videoTitle: this.data.newLessonArr[this.data.currentSection - 1].title
                })
                if (this.data.isBuy) {
                    this.setData({
                        btnRemove: false, //播放按钮消失
                    })
                }
                this.play();
            }
        })
    },
    againFreePlay() { //再次播放
        this.setData({
            freePlayCover: false,
            coverVisible: false,
        })
        this.play();
    },
    refreshVideo() { //视频出错，刷新视频
        this.setData({
            loadError: false
        })
        this.play();
    },
    play() {
        var videoContext = wx.createVideoContext('myVideo');
        videoContext.seek(0, 0);
        videoContext.play();
    },
    hideGuideVisible(e) { //去下载app
        var isLogin = false;
        if (app.judgeIsLogin()) {
            isLogin = true;
        } else {
            wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '精选课详情_下载app',
            });
        }
        app.checkLogin(this, '#loginIn').then((res) => {
            if (res.code == 3) {
                if (!isLogin) {
                    this.loginAfter(); //402的接口重新调用一下
                }
                this.setData({
                    guideVisible: !this.data.guideVisible,
                })
                let type = e.currentTarget.dataset.type;
                if (type == 1) { // 弹出
                    wx.reportAnalytics('featuredcourse_downloadalert', {});
                } else if (type == 2) {
                    wx.reportAnalytics('featuredcourse_download_deter', {});
                }
            }
        })
    },
    collectCountFn() { //收藏
        if (app.judgeIsLogin()) {
            let opt = this.data.collectState == 1 ? 2 : 1
            this.setData({
                collectState: this.data.collectState == 1 ? 0 : 1,
                ['operateInfo.collectCount']: this.data.collectState == 1 && this.data.operateInfo.collectCount > 0 ? this.data.operateInfo.collectCount - 1 : this.data.operateInfo.collectCount + 1,
            }, () => {
                inter.inter.collectFn(this.data.courseId, opt); // 调用收藏接口
            })
        } else {
            app.checkLogin(this, '#loginIn').then((res) => {
                if (res.code == 3) {
                    this.loginAfter();
                }
            })
            wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '精选课详情_收藏',
            });
        }
    },
    thumbCountFn() { //点赞
        if (app.judgeIsLogin()) {
            let data = {
                objUserId: this.data.merchantData.userId, // 课程发布者id）
                objId: this.data.courseId, // 课程：课程id）
                objImg: this.data.poster, // 课程：课程封面）
                type: 5, //  5课程
                status: '', // 状态：1、点赞，0、取消点赞
            }
            data.status = this.data.thumbState == 1 ? 2 : 1;
            this.setData({
                thumbState: this.data.thumbState == 1 ? 0 : 1,
                ['operateInfo.thumbCount']: this.data.thumbState == 1 && this.data.operateInfo.thumbCount > 0 ? this.data.operateInfo.thumbCount - 1 : this.data.operateInfo.thumbCount + 1,
            }, () => {
                inter.inter.thumbFn(data); // 调用点赞接口
            })
        } else {
            app.checkLogin(this, '#loginIn').then((res) => {
                if (res.code == 3) {
                    this.loginAfter();
                }
            })
            wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '精选课详情_点赞',
            });
        }
       
    },
    bindtimeupdate(currentTime, duration) { //监听视频播放的时间
        let currentTimeMin = currentTime.detail.currentTime;
        if (this.data.freeMin > 0 && currentTimeMin > this.data.freeMin && !this.data.coverVisible) {
            var videoContext = wx.createVideoContext('myVideo');
            videoContext.pause();
            this.setData({
                freePlayCover: true,
                coverVisible: true,
            })
            if (this.data.enterFullScreen) { //全屏情况下关闭全屏
                videoContext.exitFullScreen()
            }
        }
    },
    eventSave() {
        let _this = this;
        wx.saveImageToPhotosAlbum({
            filePath: this.data.shareImage,
            success(res) {
                wx.showToast({
                    title: '保存图片成功',
                    icon: 'success',
                    duration: 2000
                })
                _this.setData({
                    showCardModal: false,
                    imgDrawing: false
                });
            },
            fail: function (res) {}
        })
    },
    eventGetImage(event) { //绘制结束
        wx.hideLoading();
        const {
            tempFilePath,
            errMsg
        } = event.detail
        if (errMsg === 'canvasdrawer:ok') {
            this.setData({
                shareImage: tempFilePath,
                saveBtnVisible: true,
                // imgDrawing:true                
            })
        } else {
            wx.showToast({
                title: errMsg,
                icon: 'none'
            })

        }
    },
    getWxQrcode() {
        if (app.judgeIsLogin()) {
            if (this.data.imgDrawing) {
                return;
            }
            wx.showLoading({
                title: '请求海报中',
                mask: true
            })

            let that = this;
            that.setData({
                wxQrcode: ''
            });
            let data = {
                scene: that.data.courseId + ',' + wx.getStorageSync('userInfo').userId, // 课程id
                page: 'pages/course/courseInfo/courseInfo',
                type: 1,
                isHyaline: true,
            };
            app.apiRequest('/auth/wx/applet/qrcode', data, 'post').then(res => {
                if (res.data.code == 0) {
                    that.setData({
                        wxQrcode: res.data.data
                    });
                    this.eventDraw();
                } else {
                    wx.showLoading({
                        title: JSON.stringify(res.data.code + ':' + res.data.message),
                        duration: 2000
                    })
                    that.setData({
                        imgDrawing: false
                    });
                }
            }).catch(error => {
                that.setData({
                    imgDrawing: false
                });
            })
        } else {
            app.checkLogin(this, '#loginIn').then((res) => {
                if (res.code == 3) {
                    this.loginAfter();
                }
            })
            wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '精选课详情_生成海报',
            });
        }
    },
    // 生成海報
    eventDraw() {
        var that = this;
        wx.showLoading({
            title: '海报绘制中',
            mask: true
        })
        this.setData({
            showCardModal: true
        });
        let headUrl = wx.getStorageSync('userInfo').head
        let rm = headUrl.match(/(http|https)\:\/\/(\w+(\.\w+)+).*/)
        if (rm[2] == 'thirdwx.qlogo.cn' || rm[2] == 'thirdqq.qlogo.cn' || rm[2] == 'tvax2.sinaimg.cn' ||
            rm[2] == 'show-fitness.xiujianshen.com') {
            //keep original

        } else if (rm[2] != 'media.xiujianshen.com') {
            headUrl = headUrl.replace(rm[2], 'media.xiujianshen.com')
        }
        this.setData({
            qrCodeUrl: that.data.wxQrcode,
            painting: {
                width: 520,
                height: 550,
                clear: true,
                views: [{
                        type: 'image',
                        url: app.globalData.imgURL + '/littleFnImgs/bgPoster.png',
                        top: 0,
                        left: 0,
                        width: 520,
                        height: 550
                    },
                    {
                        type: 'image',
                        url: that.data.wxQrcode.replace('http:', 'https:'),
                        top: 120,
                        left: 110,
                        width: 300,
                        height: 300
                    },

                ]
            }
        })
    },
    closeFn() {
        this.setData({
            showCardModal: false,
            imgDrawing: false
        });
    },
    goUserInfo(e) {   //去商家主页
        app.goUserPage(this.data.merchantData.userId)
    },
    // 获取元素高度
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.courseHeader').boundingClientRect(function (rects) {
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
        wx.createSelectorQuery().selectAll('#player').boundingClientRect(function (rects) {
            that.setData({
                videoHeight: rects[0].height,
            })
        }).exec();
    },
    loginAfter() {
        this.setData(this.pageCache.temData);
        this.init();
        this.getPaddingTopFn();
    },
    goExam() {
      if (this.data.learnStatus.examStatus == 1) {
        this.examTipVisible = true;
      }
    },
    goH5Page(e) {
      let _this = this;
      var index = e.currentTarget.dataset.index;
      var url = '';
      var title = '';
      wx.setStorageSync('goH5Page', 1);
      if (index == 1) { //去考试
        url = '/h5/course/#/examIndex?courseId=' + _this.data.courseId;
        title = "认证考试"
      } else if (index == 2) { //领取证书
        url = '/h5/course/#/fillAdress?courseId=' + _this.data.courseId;
        title = "领取证书";
      } else if (index == 3) { //实名认证
        url = '/h5/html/identity/realname_approve.html?courseId=' + _this.data.courseId;
        title = "实名认证"
      }
      this.closePopup(e);
      wx.navigateTo({
        url: '/pages/webView/index',
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('webViewEvent', {
            url: url,
            title: title
          })
        }
      });
    },
    getCerType() {
      app.apiRequest('/course/certificate/type', {
        courseId: this.data.courseId
      }, 'get').then(res => {
        if (res.data.code == 0) {
          if (res.data.data.pass == 1) { //有高级课程
            this.setData({
              isHighCourse: true,
              ['highCoursePopup.highCourseName']: res.data.data.courseTitle,
              ['highCoursePopup.highCourseId']: res.data.data.courseId,
            })
          }
        }
      }).catch(error => {

      })
    },
    goHighCourse(e) {
      this.closePopup(e);
      wx.navigateTo({
        url: '/pages/course/courseInfo/courseInfo?courseId=' + this.data.highCoursePopup.highCourseId
      });
    },
    closePopup(e) {
      let param = e.currentTarget.dataset.param;
      this.setData({
        [param]: !this.data[param],
      })
    },
    receivCer(e) {
      let _this = this;
      app.apiRequest('/user/getAuth', {}, 'get').then(res => {
        console.log(res)
        if (res.data.code == 0) {
          if (res.data.data.userAuth == null) {
            _this.setData({
              isRealNameAuth: true
            });
          } else {
            this.goH5Page(e);
          }
        }
      })
    },
    getAdCoupon() {
        //获取课程优惠劵信息
        app.apiRequest('/coupon/visitor/getAdCoupon', {
            productId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                res.data.data.timeStatus = utils.countTimes(res.data.data.stime, res.data.data.etime); //获取优惠券时间状态
                let timeObj = utils.needBindingTimer(new Date().getTime(), res.data.data.etime, 0); //获取倒计时时间
                let _this = this;
                if (timeObj.show) {
                    let remainingTime = timeObj.time - 1000;
                    var timer = setInterval(function () {
                        remainingTime = remainingTime - 1000
                        if (remainingTime <= 0) {
                            ///定时器结束
                            clearInterval(timer);
                            return
                        }
                        _this.setData({
                            countTimes: remainingTime
                        })
                    }, 1000)
                }
                this.setData({
                    couponData: res.data.data,
                    couponId: res.data.data.couponId,
                })
                if (app.judgeIsLogin()) {
                    this.isShowCourseCoupon(res.data.data.couponId)
                } else {
                    if (res.data.data.spareCount>0){
                        this.setData({
                            iconLqCoupon: true,
                        })
                    }
                }
            }
        }).catch(error => {

        })

    },
    isShowCourseCoupon(id) {
        //领取课程优惠券
        app.apiRequest('/coupon/isShow', {
            couponId: id,
            position: 1
        }, 'post').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    iconLqCoupon: true,
                })
            } else if (res.data.code == 10010) {
                this.setData({
                    couponBtnText: '已领取',
                    couponBtn: false,
                    iconLqCoupon: true,
                    couponBtnFlag: false, //不让请求领取接口
                })
            }else{
                this.setData({
                    iconLqCoupon: false,
                })
            }
        }).catch(error => {

        })
    },
    hideCoupon() {
        if (!app.judgeIsLogin() && !this.data.couponVisible) {
            app.checkLogin(this, '#loginIn').then((res) => {
                if (res.code == 3) {
                    this.loginAfter(); //重新更新下数据
                }
            })
        } else {
            this.setData({
                couponVisible: !this.data.couponVisible
            })
        }
    },
    lqCourseConponF(id) {
        //领取课程优惠券
        if (this.data.couponBtnFlag) {
            app.apiRequest('/coupon/ad/get', {
                couponId: this.data.couponId,
                position: 1
            }, 'post').then(res => {
                if (res.data.code == 0) {
                    wx.showToast({
                        title: '抢到了！',
                        icon: 'success',
                        duration: 2000
                    })
                    this.setData({
                        couponBtnText: '已领取',
                        couponBtn: false,
                        couponBtnFlag: false, //不让请求领取接口
                        couponVisible:false,
                        ['couponData.spareCount']: this.data.couponData.spareCount - 1,
                    })
                } else if (res.data.code == 10010) {
                    this.setData({
                        couponBtnText: '已领取',
                        couponBtn: false,
                        couponBtnFlag: false, //不让请求领取接口
                    })
                } else if (res.data.code == 10006) {
                    this.setData({
                        couponBtnText: '已抢光',
                        couponBtn: false,
                        ['couponData.spareCount']: this.data.couponData.spareCount - 1,
                    })
                } else {
                    wx.showLoading({
                        title: JSON.stringify(res.data.code + ':' + res.data.message),
                        duration: 2000
                    })
                }
            }).catch(error => {

            })
        }

    },
    goBuyCourse() { //先判断是否登录
        if (app.judgeIsLogin()) {
            wx.navigateTo({
                url: '/pages/buyCourse/buyCourse?courseId=' + this.data.courseId
            });
        } else {
            app.checkLogin(this, '#loginIn').then((res) => {
                if (res.code == 3) {
                    this.loginAfter(); //重新更新下数据
                }
            })
        }
    },
})