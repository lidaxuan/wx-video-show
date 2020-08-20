// pages/buyCourse/buyCourse.js
const app = getApp();
import api from '../../api/api';
import utils from "../../utils/util.js";
Page({

    /**
     * 页面的初始数据
     */
    data: {
        marginBottom: 0,
        courseInfo: {
            price: 12
        },
        courseId: undefined, // 课程id
        payType: 2, // 支付类型（1秀豆，2微信，3支付宝，4免费）
        channel: 41, // 渠道（在选填2微信和3支付宝的时候传递，类型详情
        hideDownBox: false,
        nodataList: [{
            title: '不使用优惠券',
            couponId: '-1',
            amount: 0
        }],
        couponManageAjaxFlag: false,
        couponRuleFlag: false,
        dataList: [],
        couponInfo: {}, // 优惠券信息
        couponId: undefined, // 优惠券id
        amount: 0, // 优惠券价钱
        havecouponFlag: false, // 判断是否有优惠券
        index: 1, // 优惠券分页页码
        sendDataCount: 0, // 接口调用次数计数
        orderId: '',
        checkInterval: '', // 定时器
        timers: {}, ///定时器数组
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(opt) {
        if (opt.courseId) {
            this.setData({
                courseId: opt.courseId
            })
        }
        let info = app.getPhoneInfo().model;
        console.log(info);
        // if (info == 'iPhone X' || info == 'iPhone XR' || info == 'iPhone XS Max' || info == 'iPhone XS<iPhone11,2>') {
        //     this.setData({
        //         marginBottom: 30
        //     })
        // };
        if (info.indexOf('iPhone X') != -1 || info.indexOf('iPhone XR') != -1 || info.indexOf('iPhone XS Max') != -1 || info.indexOf('iPhone XS') != -1) {
            this.setData({
                marginBottom: 30
            })
        }
        this.getCourseInfo();
        this.getMaxCoupon();
    },

    // 页面上拉触底事件的处理函数
    onReachBottom: function() {},
    // 获取课程信息
    getCourseInfo() {
        app.apiRequest('/course/cert/one', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    courseInfo: res.data.data
                })
                if (res.data.data.ruleName) {
                    this.setData({
                        couponRuleFlag: true,
                    })
                }
            }
        })
    },
    // 获取优惠券列表
    getCouponList() {
        let data = {
            courseId: this.data.courseId,
            pageIndex: this.data.index,
            pageSize: 10,
        };
        app.apiRequest('/course/coupon/getCouponList', data, 'get').then(res => {
            if (res.data.code == 0) {
                if (res.data.data.length == 0) return;
                this.data.dataList = this.data.dataList.concat(res.data.data)
                this.setData({
                    dataList: this.data.dataList,
                    havecouponFlag: true,
                }, () => {
                    this.bindingTimerData(this.data.dataList)
                });
            }
        })
    },
    // 优惠券列表展示
    couponBtn() {
        if (this.data.dataList.length == 0) {
            this.getCouponList();
        }
        this.setData({
            hideDownBox: true,
            couponManageAjaxFlag: true
        })
    },
    // 获取当前课程的最大优惠券
    getMaxCoupon() {
        app.apiRequest('/course/coupon/getMaxCoupon', {
            courseId: this.data.courseId
        }, 'get').then(res => {
            if (res.data.code == 0) {
                if (res.data.data) {
                    this.setData({
                        couponInfo: res.data.data,
                        couponId: res.data.data.couponId,
                        amount: res.data.data.amount,
                        havecouponFlag: true,
                    })
                }
            }
        })
    },
    // 影藏优惠券
    hideDownBox(e) {
        if (e.target.id == 'downBox') {
            this.setData({
                hideDownBox: false,
            })
        }
    },
    // 优惠券的点击
    selectCoupon(e) {
        this.setData({
            couponInfo: e.currentTarget.dataset,
            couponId: e.currentTarget.dataset.item.couponId,
            amount: e.currentTarget.dataset.item.amount,
        })
        this.hideDownBox({
            target: {
                id: 'downBox'
            }
        });
    },
    // 优惠券上拉加载
    scrolltolower() {
        this.setData({
            index: this.data.index += 1
        })
        this.getCouponList();
    },
    // 购买课程
    payBtn() {
        if (this.data.courseInfo.ruleName && !this.data.couponRuleFlag) { // 有协议名称
            wx.showToast({
                icon: 'none',
                title: '请阅读并确认协议，才能支付 !',
            })
            return;
        }
        wx.showLoading({
            title: '请等待',
            mask: true,
        })
        let data = {
            courseId: this.data.courseId,
            payType: this.data.payType,
            channel: this.data.channel
        };
        if (this.data.couponId != -1 && this.data.couponId) {
            data.couponId = this.data.couponId
        }

        let buyCourseNeed = wx.getStorageSync('buyCourseNeed'); // 对象 参数看 /courseInfo onload 和 /index onload
        if (buyCourseNeed && this.data.courseId == buyCourseNeed.courseId) {
            data.upperId = buyCourseNeed.upperId;
        }

        console.log(data);
        app.apiRequest('/course/buyCourse', data, 'post').then(res => {
            if (res.data.code == 0) {
                if (this.data.courseInfo.price - this.data.amount <= 0) {
                    wx.showToast({
                        icon: 'none',
                        title: '购买成功，即将进行跳转',
                        duration: 3000
                    })
                    setTimeout(() => {
                        wx.setStorageSync('buyReturn', true);
                        wx.navigateBack({
                            delta: 1,
                        });
                    }, 3000)
                } else {
                    this.handelPayEnd(res.data.data);
                    this.setData({
                        orderId: res.data.data.orderId
                    })
                }
            } else {
                wx.hideLoading(); // 将loading影藏
                wx.showToast({
                    icon: 'none',
                    title: res.data.message,
                })
            }
        }).catch(() => {
            wx.hideLoading(); // 将loading影藏
        })
    },
    // 处理支付方式
    handelPayEnd(data) {
        let that = this;
        app.apiRequest('/bean/purchase/payOrder', {
            merOrderNumber: data.tradeId
        }, 'post').then(res => {
            if (res.data.code == 0) {
                wx.requestPayment({
                    timeStamp: res.data.data.timeStamp,
                    nonceStr: res.data.data.nonceStr,
                    package: res.data.data.package,
                    signType: 'MD5',
                    paySign: res.data.data.paySign,
                    success(res) {
                        console.log('支付结果', res)
                        that.checkStatus(); // 查询是否购买成功
                    },
                    fail(res) {
                        // console.log(res)
                        // that.checkStatus(); // 查询是否购买成功
                    }
                })
                wx.hideLoading(); // 将loading影藏
            } else {
                wx.hideLoading(); // 将loading影藏
                wx.showToast({
                    icon: 'none',
                    title: res.data.message,
                });
            }
        }).catch(() => {
            wx.hideLoading(); // 将loading影藏
        })
    },
    // 查询是否购买成功
    checkStatus() {
        wx.showLoading({
            title: '请等待',
            mask: true,
        })
        let checkInterval = setInterval(this.doCheck, 1000); //启动计时器，调用overs函数，
        this.setData({
            checkInterval: checkInterval
        });
    },
    // 调接口获取购买状态
    doCheck() {
        if (this.data.sendDataCount == 14) { // 接口调用14次的时候
            wx.showToast({
                icon: 'none',
                title: '支付失败',
            })
            this.stopCheck()
            return;
        }
        app.apiRequest('/course/buyCourseStatus', {
            orderId: this.data.orderId
        }, 'post').then(res => {
            if (res.data.code == 0) {
                let result = res.data.data; // 将结果赋值
                console.log(result)
                this.setData({
                    sendDataCount: this.data.sendDataCount += 1
                })
                if (result.payStatus) { // payStatus == true 购买成功
                    this.stopCheck();
                    wx.hideLoading();
                    wx.showToast({
                        icon: 'none',
                        title: '购买成功，即将进行跳转',
                        duration: 2000
                    })
                    this.payCouponList(result.courseId, result.couponId); // 调取返券接口
                }
            } else {
                this.setData({
                    sendDataCount: this.data.sendDataCount += 1
                })
                wx.showToast({
                    icon: 'none',
                    title: res.data.message,
                })
            }
        })
    },
    stopCheck() {
        wx.hideLoading();
        clearInterval(this.data.checkInterval);
        this.setData({
            checkInterval: null
        })
    },
    //获取返券列表
    payCouponList(courseId, couponId) {
        app.apiRequest(api.returnCouponList, {
            productId: courseId,
            couponId: couponId ? couponId:''
        }, "get").then(res => {
            if (res.data.code == 0) {
                if (res.data.data.length > 0) {
                    wx.redirectTo({
                        url: '/pages/course/buySuccess/buySuccess?courseId=' + courseId + '&couponId=' + couponId,
                    })
                } else {
                    wx.setStorageSync('buyReturn', true);
                    wx.navigateBack({
                        delta: 1,
                    });
                    // wx.redirectTo({
                    //     url: '/pages/course/courseInfo/courseInfo?courseId=' + courseId
                    // })
                }
            } else {
                wx.showLoading({
                    title: JSON.stringify(res.data.code + ':' + res.data.message),
                    duration: 2000
                })
            }
        })
    },

    ///配置data
    configData: function(data) {
        let _this = this
        let nowTime = new Date().getTime()
        data.forEach((ele, i) => {
            var timerData = utils.needBindingTimer(nowTime, ele.etime, 0)
            _this.setData({
                ['dataList[' + i + '].showTimer']: timerData.show,
                ['dataList[' + i + '].remainingTime']: timerData.time,
            })
        })
    },
    ///配置定时器
    configTimer: function(data) {
        let _this = this
        var timers = this.data.timers
        data.forEach((ele, i) => {
            if (ele.showTimer) {
                ///不存在,则创建一个新的计时器
                if (timers[ele.couponId] == undefined) {
                    _this.logTimerCount()
                    var timer = setInterval(function() {
                        console.log("计时器工作中~")
                        let itemData = _this.data.dataList[i]
                        let remainingTime = itemData.remainingTime - 1000
                        if (remainingTime <= 0) {
                            ///定时器结束
                            _this.timerFinish(itemData, i)
                            return
                        }
                        _this.setData({
                            ['dataList[' + i + '].remainingTime']: remainingTime
                        })
                    }, 1000)
                    _this.setData({
                        ['dataList[' + i + '].timer']: timer
                    })
                    ///缓存定时器
                    timers[ele.couponId] = timer
                }
            }

        })
        _this.setData({
            timers: timers
        })
    },
    ///根据数据绑定定时器
    bindingTimerData: function(data) {
        this.configData(data)
        this.configTimer(data)
    },
    ///打印当前定时器的总数
    logTimerCount: function() {
        var count = 1
        for (let key in this.data.timers) {
            count++
        }
    },
    ///定时器结束
    timerFinish: function(item, i) {
        clearInterval(item.timer)
        this.setData({
            ['dataList[' + i + '].showTimer']: false,
        })
    },
    ///清除计时器
    clearTimers: function() {
        for (let key in this.data.timers) {
            clearInterval(this.data.timers[key])
        }
        this.setData({
            timers: {}
        })
    },
    // 协议点击进去协议页面
    coursePurchaseBtn() {
        wx.navigateTo({
            url: '/pages/rule/coursePurchase/coursePurchase?courseId=' + this.data.courseId,
        })
    },
    // 协议点击
    ruleNameBtn() {
        this.setData({
            couponRuleFlag: this.data.couponRuleFlag == true ? false : true
        })
    }
})