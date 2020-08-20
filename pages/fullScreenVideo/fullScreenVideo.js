// pages/fullScreenVideo/fullScreenVideo.js
const app = getApp();
import cryptoJs from '../../utils/crypto.js';
import inter from '../../utils/api'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        courseId: '',
        courseInfo: {},
        isFull: false,
        paddingTop: 0,
        followFlag: false,
        currentUserId: wx.getStorageSync('userInfo').userId,

        oneDeed: false,
        twoDeed: false,
        threeDeed: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(opt) {
        this.setData({
            courseId: opt.courseId
        })
        this.getData(opt.courseId);
    },
    onShow:function() {
        this.getPaddingTopFn();
    },
    getData(courseId) {
        app.apiRequest('/course/cert/publicOne', {
            courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                let prame = res.data.data;
                prame.video.transcodeUrl = cryptoJs.decrypt(prame.video.transcodeUrl ? prame.video.transcodeUrl : '')
                this.setData({
                    courseInfo: prame
                });
                if (app.judgeIsLogin()) {
                    this.getFollow(prame.merchant.userId);
                }
            }
        })
    },
    // 获取关注列表状态
    getFollow(id) {
        if (id == this.data.currentUserId) {
            return;
        }
        let data = {
            otherId: id,
            userId: wx.getStorageSync('userInfo').userId
        }
        app.apiRequest('/social/relation/h/relationstatus', data, 'get').then(res => {
            if (res.data.code == 0) {
                if (res.data.data[0].relation == 0) { // 未关注
                    this.setData({
                        followFlag: false
                    })
                } else { // 已关注
                    this.setData({
                        followFlag: true
                    })
                }
            } else {
                wx.showToast({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
    },
    // 跳转个人中心
    goUserInfoBtn(e) {
      let id = e.currentTarget.dataset.item.merchant.userId
      app.goUserPage(id);
    },
    // 关注
    followBtn() {
        // 统计
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '公开视频_单个_关注',
        });
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let otherId = this.data.courseInfo.merchant.userId;
                this.setData({
                    followFlag: true
                })
                inter.inter.followFn(otherId, 1); 
            }
        })
    },
    // 收藏
    collectionBtn() {
        // 统计
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '公开视频_单个_收藏',
        });
        app.checkLogin(this, "#login").then((res) => {
            if (res.code == 3) {
                let opt = undefined,
                    str = '';
                let courseId = this.data.courseInfo.course.id; // 课程id
                let collect = this.data.courseInfo.overCollect; // 是否关注
                if (collect == false) {
                    opt = 1;
                    this.data.courseInfo.overCollect = true;
                    this.data.courseInfo.operateCount.collectCount += 1;
                    this.setData({
                        courseInfo: this.data.courseInfo
                    })
                    str = '收藏成功';
                } else {
                    opt = 2;
                    this.data.courseInfo.overCollect = false;
                    this.data.courseInfo.operateCount.collectCount -= 1;
                    this.setData({
                        courseInfo: this.data.courseInfo
                    })
                    str = '取消收藏';
                }
                wx.showToast({
                    title: str,
                })
                // 修改当前数据
                inter.inter.collectFn(courseId, opt); // 调用分享接口
            }
        })
    },
    // 点赞
    thumbsUpBtn() {
        // 统计
        !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
            triggertime: 0,
            triggeraddress: '公开视频_单个_点赞',
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
                let courseInfo = this.data.courseInfo;
                let index = courseInfo.index; // 数据在列表中索引
                data.objUserId = courseInfo.merchant.userId;
                data.objId = courseInfo.course.id;
                data.objImg = courseInfo.course.cover;
                if (courseInfo.overThumb == false) { // 未点赞
                    data.status = 1;
                    this.data.courseInfo.overThumb = true;
                    this.data.courseInfo.operateCount.thumbCount += 1;
                    this.setData({
                        courseInfo: this.data.courseInfo
                    })
                    str = '点赞+1';
                } else {
                    data.status = 0;
                    this.data.courseInfo.overThumb = false;
                    this.data.courseInfo.operateCount.thumbCount -= 1;
                    this.setData({
                        courseInfo: this.data.courseInfo
                    })
                    str = '点赞-1';
                }
                wx.showToast({
                    title: str,
                })
                inter.inter.thumbFn(data);
            }
        })
    },
    // 转发 小程序 发送给朋友
    onShareAppMessage: function (res) {
        let courseId = this.data.courseInfo.course.id; //获取产品id
        let title = this.data.courseInfo.course.title; //获取产品标题
        let cover = this.data.courseInfo.course.cover; //产品图片
        if (app.judgeIsLogin()) {
            inter.inter.shareFn(courseId); // 调用分享接口
        }
        let upperId = '';
        if (wx.getStorageSync('userInfo') && wx.getStorageSync('userInfo').userId) {
            upperId = wx.getStorageSync('userInfo').userId
        }
        if (res.from === 'button') {
            // 来自页面内转发按钮
            return {
                title: title,
                path: 'pages/index/index?courseId=' + courseId + '&upperId=' + upperId,
                imageUrl: cover, //不设置则默认为当前页面的截图
            }
        } else if (res.from == 'menu') {
            ///首页视频流
            return {
                title: '热爱就要秀出来，这里有健身大咖的更多超清课程，快来观看啊～',
                path: 'pages/index/index',
                imageUrl: '/static/img/share_cover.png',
            }
        }
    },
    // 视频播放时长 调用户统计行为接口
    timeupdate(e) {
        let courseId = this.data.courseInfo.course.id;
        var duration = e.detail.duration; // 视频总时长
        var currentTime = e.detail.currentTime; // 视频播放时长
        if (currentTime > 3 && (currentTime / duration) < 0.8 && !this.data.oneDeed) {
            inter.inter.sendDeedFn(courseId, 1);
            this.setData({
                oneDeed:true
            })
        } else if ((currentTime / duration) > 0.8 && !this.data.twoDeed) {
            inter.inter.sendDeedFn(courseId, 2);
            this.setData({
                twoDeed: true
            })
        } else if (currentTime < 3 && !this.data.threeDeed) {
            inter.inter.sendDeedFn(courseId, 3);
            this.setData({
                threeDeed: true
            })
        }
    },
    /**视屏进入、退出全屏 */
    fullBtn() {
        var videoContext = wx.createVideoContext('video');
        console.log(videoContext)
        videoContext.requestFullScreen();
        this.setData({
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
    // 获取顶部高度
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.header').boundingClientRect(function (rects) {
            that.setData({
                paddingTop: rects[0].height,
                paddingBottom: app.globalData.systemInfo.statusBarHeight
            })
        }).exec();
    },
})