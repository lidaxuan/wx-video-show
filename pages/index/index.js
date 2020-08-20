//index.js
//获取应用实例
//获取应用实例
import {
    list1,
    list2
} from './mock.js'

import inter from '../../utils/api'
var notification = require('../../components/WxNotificationCenter/WxNotificationCenter.js')
const app = getApp()
let videoContext = null; //video实例
let time = null

import cryptoJs from '../../utils/crypto.js';

Page({
    properties: {
        phone: { // 属性名
            type: Number, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
            value: '' // 属性初始值（可选），如果未指定则会根据类型选择一个
        }
    },
    data: {
        currentUserId: wx.getStorageSync('userInfo').userId,
        currentTab: 0,
        paddingTop: 0,
        paddingBottom: 0,
        // -------------------------------------------------------
        courseId: 1, // 视频Id
        videoIndex: 0,
        videoList: [], // 视频列表

        swiperData: [], //swiperItem绑定数据
        isNext: false, //是否向下滑动（向上滑动）
        lastSwiperIndex: 0, //记录swiper index
        beforeIndex: 2,
        currentIndex: 0,
        afterIndex: 1,

        videoParam: {}, // 当前播放视频
        playMark: 2, // 播放开关 1是暂停 2是播放
        fullScreen: false,
        fullScreenId: 'myVideo0',
        isFull: false,
        height: 0,
        swiperIndex: undefined, // 播放视频的时候 的 id
        opt: undefined, // 1.收藏 2.取消收藏  后台返回数据

        followArr: [], // 关注状态数据

        pageSize: 15, // 
        labelIndex: 0,
        classifyIndex: 0,
        courseId: '',

        firstLoadFlag: false,
        oneDeed: false,
        twoDeed: false,
        threeDeed: false,

        videoChangeCount: 0, // 视频划
        showLogin: false,
    },
    onShow: function() {
        if (this.data.swiperIndex) {
            this.play(this.data.swiperIndex)
        }
        if (wx.getStorageSync('needLogin')) {
            app.showLoginMask(this, '#login');
            wx.setStorageSync('needLogin', false)
        }
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {
        this.stop();
    },
    //事件处理函数
    bindViewTap: function() {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    onLoad: function(e) {
        ///注册关注通知
        notification.addNotification("focus", this.notify_receive_focus,this)
        if (e.courseId) { // 是否有课程id
            this.setData({
                courseId: e.courseId
            })
        }
        if (e.upperId) { // 是否有上级id
            wx.setStorage({
                key: 'upperId',
                data: e.upperId,
            })
            // 首页 普通模式进来 存数据
            let bindingPhoneParam = {
                upperId: e.upperId,
                courseId: e.courseId
            }
            wx.setStorageSync('bindingPhoneParam', bindingPhoneParam);
        }
        // 首页 扫描二维码进入 情况不会出现 保留 --------- 玄
        if (e.scene && e.scene.indexOf('%2C') != -1) {
            let arr = e.scene.split('%2C');
            this.setData({
                courseId: arr[0]
            })
            // ---------------------------同上
            let bindingPhoneParam = {
                upperId: arr[1],
                courseId: arr[0]
            }
            wx.setStorageSync('bindingPhoneParam', bindingPhoneParam);
        }
        this.getPaddingTopFn();
        if (!this.data.videoList.length) {
            this.getData(true);
        }
    },
    ////收到关注通知
    notify_receive_focus(info) {
      console.log(info)
      this.data.videoList.forEach((ele,i)=>{
        if(ele.merchant.id == info.userId){
          ele.merchant.relation = info.relation
        }
      })
      this.setSwiperData()
    },
    // 获取列表数据
    getData(flag = false) {
        wx.showLoading({
            title: '请耐心等待',
        })
        let data = {
            // fil: 1,
            pageSize: this.data.pageSize,
            labelIndex: this.data.labelIndex,
            classifyIndex: this.data.classifyIndex,
        }
        if (flag) {
            data.courseId = this.data.courseId ? this.data.courseId : ''
        }
        app.apiRequest('/search/foreign/course/hotCourse', data, 'post').then(res => {
            if (res.data.code == 0) {
                let list = res.data.data.courseInfo;
                list.forEach((ele, i) => {
                    ele.video.transcodeUrl = cryptoJs.decrypt(ele.video.transcodeUrl ? ele.video.transcodeUrl : '')
                })
                this.data.videoList = this.data.videoList.concat(list);

                this.data.videoList.forEach((ele, i) => {
                    ele.index = i
                })
                this.data.classifyIndex = res.data.data.classifyIndex
                this.data.labelIndex = res.data.data.labelIndex
                if (!this.data.firstLoadFlag) {
                  this.videoOnload(list[0].course); // 将第一个数据的id传入
                  this.data.firstLoadFlag = true
                }
                this.getFollow(list)
                wx.hideLoading();
            } else {
                wx.showToast({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
    },
    // 获取数据之后视频列表去播放
    videoOnload(e) {
        // 拿到当前视频的实例
        this.videoContext0 = wx.createVideoContext('myVideo0')
        // 拿到当前视频的实例
        this.videoContext1 = wx.createVideoContext('myVideo1')
        // 拿到当前视频的实例
        this.videoContext2 = wx.createVideoContext('myVideo2')
        /* 初始化页面视频id 及 视频下标 */
        this.setData({
            courseId: e.id
        })

        let videoIndex = this.data.videoList.findIndex(v => v.course.id == this.data.courseId)
        let swiperIndex = videoIndex % 3
        this.initCurrent(swiperIndex, videoIndex)
        this.setSwiperData()
        this.play(videoIndex); /* 开始播放视频 */
    },
    ///设置当前swiperIndex
    initCurrent(swiperIndex, dataIndex) {
        this.data.lastSwiperIndex = swiperIndex
        this.data.currentIndex = dataIndex
        this.data.beforeIndex = swiperIndex == 0 ? this.data.videoList.length - 1 : dataIndex - 1
        this.data.afterIndex = swiperIndex == this.data.videoList.length - 1 ? 0 : dataIndex + 1
    },
    //改变当前的current 
    changeCurrent(swiperIndex) {
        if (this.data.lastSwiperIndex + 1 == swiperIndex || this.data.lastSwiperIndex - 2 == swiperIndex) {
            this.data.isNext = true
        } else {
            this.data.isNext = false
        }
        this.data.lastSwiperIndex = swiperIndex
        if (this.data.isNext) {
            if (this.data.currentIndex == this.data.videoList.length - 1) {
                this.data.currentIndex  = 0
            } else {
                this.data.currentIndex = this.data.currentIndex + 1
            }
        } else {
            if (this.data.currentIndex == 0) {
                this.data.currentIndex = this.data.videoList.length - 1
            } else {
                this.data.currentIndex = this.data.currentIndex - 1
            }
        }

        if (this.data.isNext) { //向上滑动
          this.data.beforeIndex = this.data.currentIndex == 0 ? this.data.videoList.length - 1 : this.data.currentIndex - 1
          this.data.afterIndex = this.data.currentIndex == this.data.videoList.length - 1 ? 0 : this.data.currentIndex + 1
        } else { //向下滑动
            this.data.beforeIndex = this.data.currentIndex == this.data.videoList.length - 1 ? 0 : this.data.currentIndex + 1
            this.data.afterIndex = this.data.currentIndex == 0 ? this.data.videoList.length - 1 : this.data.currentIndex - 1
        }
    },
    //current 改变切换swiper绑定数据源
    setSwiperData() {
        let swiperData = []
        let before = this.data.videoList[this.data.beforeIndex]
        let current = this.data.videoList[this.data.currentIndex]
        let after = this.data.videoList[this.data.afterIndex]
        switch (this.data.lastSwiperIndex) {
            case 0:
                swiperData = [current, after, before]
                break
            case 1:
                swiperData = [before, current, after]
                break
            case 2:
                swiperData = [after, before, current]
                break
            default:
        }
        this.setData({
            swiperData: swiperData
        })
        console.log("SwiperIndex==>", this.data.lastSwiperIndex, "dataindex==>", this.data.beforeIndex, this.data.currentIndex, this.data.afterIndex)
    },
    // 切换tab栏
    switchTab(e) {
        let tab = e.currentTarget.id
        if (tab === 'popularRecommendation') {
            this.setData({
                currentTab: 0
            })
        } else if (tab === 'selectedCourse') {
            this.setData({
                currentTab: 1
            })
        } else if (tab === 'myCourseRack') {
            this.setData({
                currentTab: 2
            })
        }
    },
    // 获取顶部高度
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.container').boundingClientRect(function(rects) {
            that.setData({
                paddingTop: rects[0].height,
                paddingBottom: app.globalData.systemInfo.statusBarHeight
            })
        }).exec();
    },
    // ----------------------------------------------------------
    /**
     *  current 变化时 修改视频容器对应的数据
     */
    changeItem(e) {
        console.log(e.detail.current)
        let to = e.detail.current
        this.setData({
            fullScreenId: 'myVideo' + to,
            oneDeed: false,
            twoDeed: false,
            threeDeed: false
        })
        this.stop(); /* 销毁视频实例 */

        this.changeCurrent(to)
        this.setSwiperData()
        this.isLoginAndGetData()

        this.play(to); /* 开始播放视频 */
    },
    // 获取关注列表状态
    getFollow(originalData) {
      if (!app.judgeIsLogin()) return
      if (originalData.length <= 0) return
      let ids = [];
      originalData.forEach(ele => {
        ids.push(ele.merchant.id);
      })
      if (!ids.length) return;
      let data = {
        otherId: ids.join(),
        userId: wx.getStorageSync('userInfo').userId
      }
      app.apiRequest('/social/relation/h/relationstatus', data, 'get').then(res => {
        if (res.data.code == 0) {
            originalData.forEach((ele, index) => {
            res.data.data.forEach((e, i) => {
              if (e.otherId == ele.merchant.id) {
                ele.merchant.relation = e.relation;
                if (ele.merchant.id == this.data.currentUserId) {
                    ele.merchant.relation = 3;
                }
              }
            })
          })
          this.setSwiperData()
        } 
      })
    },
    // 根据swiperIndex videoIndex匹配对应数据
    isLoginAndGetData() {
        if (this.data.isNext) {
            //popup login 
            if (!app.judgeIsLogin()) {
                app.showLoginMask(this, "#login")
                // 统计
                !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
                    triggertime: 0,
                    triggeraddress: '首页_加载更多视频',
                });
            }
        }
        if (this.data.afterIndex == (this.data.videoList.length - 3) && app.judgeIsLogin()) {
            this.getData();
        }
    },
    // 播放
    play(swiperIndex) {
        let that = this;
        swiperIndex = parseInt(swiperIndex)
        this.data.swiperIndex = swiperIndex
        switch (swiperIndex) {
            case 0:
                that.videoContext0 && that.videoContext0.play()
                break;
            case 1:
                that.videoContext1 && that.videoContext1.play()
                break;
            case 2:
                that.videoContext2 && that.videoContext2.play()
                break;
            default:
        }
    },
    // 销毁视频 注意 必须在切换之前销毁
    stop() {
        this.videoContext0 && this.videoContext0.pause()
        this.videoContext1 && this.videoContext1.pause()
        this.videoContext2 && this.videoContext2.pause()
    },
    // 关注
    followBtn(e) {
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '首页_关注',
        });
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let merchant = this.getVideoParam().merchant
                notification.postNotificationName("focus",{userId:merchant.id,relation:1});
                inter.inter.followFn(merchant.id, 1); // 调用分享接口
            }
        })
    },
    /**视屏进入、退出全屏 */
    fullBtn(e) {
        var videoContext = wx.createVideoContext(this.data.fullScreenId, this);
        videoContext.requestFullScreen();
        this.setData({
            fullScreen: true,
            isFull: true
        })
    },
    // 监听进入全屏
    fullScreen(e) {
        if (e.detail.fullScreen) {
            this.setData({
                isFull: true
            })
        } else {
            this.setData({
                isFull: false
            })
        }
    },
    // 视频播放时长 调用户统计行为接口
    timeupdate(e) {
        let courseId = this.getVideoParam().course.id;
        var duration = e.detail.duration; // 视频总时长
        var currentTime = e.detail.currentTime; // 视频播放时长
        if (currentTime > 3 && (currentTime / duration) < 0.8 && !this.data.oneDeed) {
            inter.inter.sendDeedFn(courseId, 1);
            this.data.oneDeed = true
        } else if ((currentTime / duration) > 0.8 && !this.data.twoDeed) {
            inter.inter.sendDeedFn(courseId, 2);
            this.data.twoDeed = true
        } else if (currentTime < 3 && !this.data.threeDeed) {
            inter.inter.sendDeedFn(courseId, 3);
            this.data.threeDeed = true
        }
    },
    onReachBottom: function() {
        // 页面触底时执行
        if (this.data.currentTab == 1) { //精选课程 加载更多
            this.selectComponent("#idMainCourse").getData();
        } else if (this.data.currentTab == 2) { //我的课架 加载更多
            this.selectComponent("#mycourse").loadMoreData();
        }
    },
    // 查看更多
    lookMoreBtn(e) {
        let courseId = e.currentTarget.dataset.item.course.id;
        app.globalData.courseid = courseId;
        wx.navigateTo({
            url: '/pages/course/courseInfo/courseInfo?courseId=' + courseId,
        })
    },
    // 跳转个人中心
    goUserInfoBtn(e) {
        let id = e.currentTarget.dataset.item.merchant.id
        app.goUserPage(id);
    },
    // 点赞
    thumbsUpBtn(e) {
        // console.log(e); return;
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '首页_点赞',
        });
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let data = {
                    objUserId: '', // 课程发布者id）
                    objId: '', // 课程：课程id）
                    objImg: '', // 课程：课程封面）
                    type: 5, //  5课程
                    status: '', // 状态：1、点赞，0、取消点赞
                }
                let str = '';
                let currentVideoParme = this.getVideoParam(); // 获取数据
                let index = currentVideoParme.index; // 数据在列表中索引
                data.objUserId = currentVideoParme.merchant.id;
                data.objId = currentVideoParme.course.id;
                data.objImg = currentVideoParme.course.cover;
                if (currentVideoParme.course.thumb == false) { // 未点赞
                    data.status = 1;
                    this.data.videoList[index].course.thumb = true;
                    // this.data.videoList[index].course.thumbCount += 1;
                    currentVideoParme.course.thumb = true;
                    currentVideoParme.course.thumbCount += 1;
                    str = '点赞+1';
                } else {
                    data.status = 0;
                    this.data.videoList[index].course.thumb = false;
                    // this.data.videoList[index].course.thumbCount -= 1;
                    currentVideoParme.course.thumb = false;
                    currentVideoParme.course.thumbCount -= 1;
                    str = '点赞-1';
                }
                let swiperIndex = this.getVideoIndex()
                this.setData({
                    ['videoList[' + index + ']']: this.data.videoList[index],
                    ['swiperData[' + swiperIndex + ']']: currentVideoParme
                })
                wx.showToast({
                    title: str,
                })
                inter.inter.thumbFn(data);
            }
        })
    },
    // 收藏
    collectionBtn(e) {
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '首页_收藏',
        });

        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let opt = undefined,
                    str = '';
                let videoParam = this.getVideoParam(); // 获取数据
                let index = videoParam.index;
                let courseId = videoParam.course.id; // 课程id
                let collect = videoParam.course.collect; // 是否关注
                if (collect == false) {
                    opt = 1;
                    videoParam.course.collect = true;
                    videoParam.course.collectCount += 1;
                    str = '收藏成功';
                } else {
                    opt = 2;
                    videoParam.course.collect = false;
                    videoParam.course.collectCount -= 1;
                    str = '取消收藏';
                }
                let swiperIndex = this.getVideoIndex()
                this.setData({
                    ['videoList[' + index + ']']: this.data.videoList[index],
                    ['swiperData[' + swiperIndex + ']']: videoParam
                })
                wx.showToast({
                    title: str,
                })
                // 修改当前数据
                inter.inter.collectFn(courseId, opt); // 调用分享接口
            }
        })
    },
    // 转发 小程序 发送给朋友
    onShareAppMessage: function(res) {
        // 统计
        // console.log(res);return;

        // this.data.videoParam.course.shareCount += 1;
        // this.setData({
        //     videoParam: this.data.videoParam
        // })
        if (res.from === 'button') {
            // 来自页面内转发按钮
            let videoParam = this.getVideoParam();
            let courseId = videoParam.course.id; //获取产品id
            let title = videoParam.course.title; //获取产品标题
            let cover = videoParam.video.cover; //产品图片

            let index = videoParam.index;
            this.data.videoList[index].course.shareCount += 1;
            
            wx.reportAnalytics('indexrecommend_share', {});
            if (app.judgeIsLogin()) {
              inter.inter.shareFn(courseId); // 调用分享接口
            }
            return {
                title: title,
                path: 'pages/index/index?courseId=' + courseId + '&upperId=' + wx.getStorageSync('userInfo').userId,
                imageUrl: cover, //不设置则默认为当前页面的截图
            }
        }else if(res.from == 'menu'){
            ///首页视频流
            return {
              title: '热爱就要秀出来，这里有健身大咖的更多超清课程，快来观看啊～',
              path: 'pages/index/index',
              imageUrl: '/static/img/share_cover.png',
            }
        }
    },
    getVideoParam() {
        return this.data.videoList[this.data.currentIndex]
    },
    getVideoIndex() {
        let index = this.data.fullScreenId.replace('myVideo', '');
        if (index == 0) {
            return 0;
        } else if (index == 1) {
            return 1;
        } else if (index == 2) {
            return 2;
        }
    },
    // 视频播放出错时触发
    binderror(err) {
        console.log(err)
    }
})