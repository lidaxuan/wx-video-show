// components/videoList/videoList.js
const app = getApp();
const timeD = require("../../utils/util.js");
import inter from '../../utils/api';
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        dataList: Array,
        getfollowIdArr: Array,
        type: Number,
    },
    /**
     * 组件的初始数据
     */
    data: {
        videoPlay: null,
        dataList: [],
        courseId: '197675',
        title: '',
        cover: '', // http://pic.rmb.bdstatic.com/mvideo/cde67c41211d7a46c1fb87138935b912
        videoList: [],
        videoSrcList: [],
        len: 0,
        videoSrcListResult: false,
        hideModal: true, //模态框的状态  true-隐藏  false-显示
        animationData: {}, // 动画集
        painting: {}, // 海報
        shareImage: '', // 生成海报图片
        hideCardModal: true, // 海報彈框
        flag: false,
        hasLogin: false,
        wxQrcode: '', // 分享的二维码
        videoParam: {},
        // playVideoIndex: undefined,
        oneDeed: false,
        twoDeed: false,
        threeDeed: false,

        // scrollTopDynamic:0,///实时滚动距离
        // scrollTop:0,
    },

    lifetimes: {
        attached: function() {
           
        },
    },
    observers: {
        
    },
    pageLifetimes: {
        show: function() {
           
        },
        hide: function() {
            
        },
    },
    /**
     * 组件的方法列表
     */
    methods: {
        stopVideoFn() {
            let videoContextPrev = wx.createVideoContext(this.data._index + "")
            videoContextPrev.stop();
        },
        // 点击cover播放，其它视频结束
        videoPlay: function(e) {
            this.setData({
                oneDeed: false,
                twoDeed: false,
                threeDeed: false,
            })
            this.triggerEvent('videoPlay');
            var _index = e.currentTarget.dataset.index;
            this.setData({
                _index: _index,
                videoParam: e.currentTarget.dataset.item ? e.currentTarget.dataset.item : ''
            })
            //停止正在播放的视频
            var videoContextPrev = wx.createVideoContext(_index + "")
            videoContextPrev.stop();
            // setTimeout(function() {
            //     //将点击视频进行播放
            //     var videoContext = wx.createVideoContext(_index + "")
            //     videoContext.play();
            // }, 500)
        },
        ///监听视频全屏
        screenChange:function(e) {
          //调用父组件方法
          console.log("监听到全屏了",e)
          this.triggerEvent('screenChange',e)
        },
        // 获取分类列表
        getClassify() {
            app.apiRequest('/course/classify/list', null, 'get').then(res => {
                if (res.data.code == 0) {
                    this.setData({
                        tabListL: res.data.data
                    });
                } else {
                    wx.showToast({
                        title: res.data.code + ':' + res.data.message,
                        duration: 2000
                    })
                }
            })
        },
        // 每一个视频点击事件 展示原封面
        vidClickFn(event) {
            let query = wx.createSelectorQuery();
            let queryNode = query.selectAll('#vid')
            if (this.data.flag == false) {
                this.setData({
                    flag: true
                })
            } else {
                this.setData({
                    flag: false
                })
            }
            if (queryNode.pause) {
                this.setData({
                    flag: false
                })
            } else {
                this.setData({
                    flag: true
                })
            }
        },
        visibleToggle(e) {
            this.setData({
                hasLogin: e.detail
            });
        },
        // 点击分享按钮 获取小程序二维码
        getWxQrcode() {
            let that = this;
            that.setData({
                wxQrcode: ''
            });
            let data = {
                scene: 'courseId=' + that.data.courseId, // 课程id
                page: 'pages/index/index',
                type: 1,
                isHyaline: true,
            };
            app.apiRequest('/auth/wx/applet/qrcode', data, 'post').then(res => {
                if (res.data.code == 0) {
                    that.setData({
                        wxQrcode: res.data.data
                    });
                    // wx.showLoading({ title: res.data, duration: 2000 })
                } else {
                    wx.showLoading({
                        title: JSON.stringify(res.data.code + ':' + res.data.message),
                        duration: 2000
                    })
                }
            })
        },
        // 关注
        followBtn(e) {
            !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '公开视频_关注',
            });
            app.checkLogin(this, "#login").then((res) => {
                if (res.code == 3) {
                    let otherId = e.currentTarget.dataset.item.merchant.id;
                    let index = e.currentTarget.dataset.index;
                    if (this.properties.type == 1) {
                        this.properties.dataList[index].user.relation = 1;
                    } else {
                        this.properties.dataList.forEach(ele => {
                            if (ele.user.id == otherId){
                                ele.user.relation = 1;
                            }
                        })
                    }
                    this.setData({
                        dataList: this.properties.dataList
                    })
                    inter.inter.followFn(otherId, 1); // 调用分享接口
                }
            })
        },
        // 收藏
        collectionBtn(e) {
            !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '公开视频_收藏',
            });
            app.checkLogin(this, "#login").then((res) => {
                if (res.code == 3) {
                    if (app.judgeIsLogin() && this.data.collectionNum == 1) {
                        this.triggerEvent('onLoginSuccess'); // 触发登录
                        this.setData({
                            collectionNum: 2
                        })
                        return;
                    }
                    let opt = undefined,
                        str = '';
                    let videoInfo = e.currentTarget.dataset;
                    let index = videoInfo.index; // 索引
                    let courseId = videoInfo.item.course.id; // 课程id
                    let collect = videoInfo.item.course.collect; // 是否收藏
                    if (collect == false) {
                        opt = 1;
                        this.properties.dataList[index].course.collect = true;
                        this.properties.dataList[index].course.collectCount += 1;
                        this.setData({
                            dataList: this.properties.dataList
                        })
                        str = '收藏成功';
                    } else {
                        opt = 2;
                        this.properties.dataList[index].course.collect = false;
                        this.properties.dataList[index].course.collectCount -= 1;
                        this.setData({
                            dataList: this.properties.dataList
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
        thumbsUpBtn(e) {
            !app.judgeIsLogin() && wx.reportAnalytics('triggerloginlayer', {
                triggertime: 0,
                triggeraddress: '公开视频_点赞',
            });
            app.checkLogin(this, "#login").then((res) => {
                if (res.code == 3) {
                    if (app.judgeIsLogin() && this.data.thumbsUpNum == 1) {
                        this.triggerEvent('onLoginSuccess'); // 触发登录
                        this.setData({
                            thumbsUpNum: 2
                        })
                        return;
                    }
                    let data = {
                        objUserId: '', // 课程发布者id）
                        objId: '', // 课程：课程id）
                        objImg: '', // 课程：课程封面）
                        type: 5, //  5课程
                        status: '', // 状态：1、点赞，0、取消点赞
                    }
                    let opt = undefined,
                        str = '';
                    let videoInfo = e.currentTarget.dataset;
                    let index = videoInfo.index; // 索引
                    let courseId = videoInfo.item.course.id; // 课程id
                    let thumb = videoInfo.item.course.thumb; // 是否点赞

                    data.objUserId = videoInfo.item.merchant.id;
                    data.objId = videoInfo.item.course.id;
                    data.objImg = videoInfo.item.course.cover;

                    if (thumb == false) { // 未点赞
                        data.status = 1;
                        this.properties.dataList[index].course.thumb = true;
                        this.properties.dataList[index].course.thumbCount += 1;
                        this.setData({
                            dataList: this.properties.dataList
                        })
                        str = '点赞+1';
                    } else {
                        data.status = 0;
                        this.properties.dataList[index].course.thumb = false;
                        this.properties.dataList[index].course.thumbCount -= 1;
                        this.setData({
                            dataList: this.properties.dataList
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
        // 视频播放时长 调用户统计行为接口
        timeupdate(e) {
            if (!this.data.videoParam.course) return;
            let courseId = this.data.videoParam.course.id;
            var duration = e.detail.duration; // 视频总时长
            var currentTime = e.detail.currentTime; // 视频播放时长
            if (currentTime > 3 && (currentTime / duration) < 0.8 && !this.data.oneDeed) {
                inter.inter.sendDeedFn(courseId, 1);
                this.data.oneDeed = true;
            } else if ((currentTime / duration) > 0.8 && !this.data.twoDeed) {
                inter.inter.sendDeedFn(courseId, 2);
                this.data.twoDeed = true;
            } else if (currentTime < 3 && !this.data.threeDeed) {
                inter.inter.sendDeedFn(courseId, 3);
                this.data.threeDeed = true;
            }
        },
        goUserPageBtn(e) {
            let id = e.currentTarget.dataset.item.merchant.id;
            app.goUserPage(id)
        },
        gocourseinfoBtn(e) {
            // 统计
            wx.reportAnalytics('classification_detail', { });
            app.globalData.courseid = e.currentTarget.dataset.item.course.id;
            wx.navigateTo({
                url: '/pages/course/courseInfo/courseInfo?courseId=' + e.currentTarget.dataset.item.course.id,
            })
        }
    }
})