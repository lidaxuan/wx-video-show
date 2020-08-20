// {
//     "couponId": 115251, 券id
//     "productId": 198699, 商品id
//     "amount": 100, 面额
//     "couponUserId": 105, 券创建人id
//     "stime": 1570014060000, 生效时间
//     "etime": 1572350460000, 失效时间
//     "productTitle": "IBFA产后恢复教练国际认证课程"    商品名称
// }
import utils from "../../../utils/util.js";

const app = getApp();
import api from '../../../api/api';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        couponList: [],
        headerTop: 0,
        nowtime: Date.parse(new Date()),
        timers: {}
    },
    onLoad: function(options) {
        this.getPaddingTopFn();
        this.getCouponList(options.courseId, options.couponId); //课程id  优惠券id
    },
    //获取返券列表
    getCouponList(courseId, couponId) {
        let data = {
            productId: courseId,
            couponId: couponId ? couponId : ''
        }
        app.apiRequest(api.returnCouponList, data, "get").then(res => {
            if (res.data.code == 0) {
                // res.data.data = [{
                //     "couponId": 115251, //券id
                //     "productId": 198699, //商品id
                //     "amount": 100, //面额
                //     "couponUserId": 105, //券创建人id
                //     "stime": 1573975391000, //生效时间
                //     "etime": 1573975391000, //失效时间
                //     "productTitle": "IBFA产后恢复教练国际认证课程" //商品名称
                // },
                // {
                //     "couponId": 115252, //券id
                //     "productId": 198699, //商品id
                //     "amount": 100, //面额
                //     "couponUserId": 105, //券创建人id
                //     "stime": 1573716191000, //生效时间
                //     "etime": 1573975391000, //失效时间
                //     "productTitle": "IBFA产后恢复教练国际认证课程" //商品名称
                // },
                // {
                //     "couponId": 115253, //券id
                //     "productId": 198699, //商品id
                //     "amount": 100, //面额
                //     "couponUserId": 105, //券创建人id
                //     "stime": 1573716191000, //生效时间
                //     "etime": 1573975391000, //失效时间
                //     "productTitle": "IBFA产后恢复教练国际认证课程" //商品名称
                // },
                // ]
                res.data.data.forEach((ele, i) => {
                    ele.timeStatus = utils.countTimes(ele.stime, ele.etime)
                })
                this.setData({
                    couponList: res.data.data
                });
                this.bindingTimerData(this.data.couponList);
            } else {
                wx.showLoading({
                    title: JSON.stringify(res.data.code + ':' + res.data.message),
                    duration: 2000
                })
            }

        })
    },
    goCourseInfo(e) {
        let courseId = e.currentTarget.dataset.item.productId;
        wx.navigateTo({
            url: '/pages/course/courseInfo/courseInfo?courseId=' + courseId,
        })
    },
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.page-header').boundingClientRect(function(rects) {
            that.setData({
                headerTop: rects[0].height,
            })
        }).exec();
    },

    ///配置data
    configData: function(data) {
        let _this = this
        let nowTime = new Date().getTime()
        data.forEach((ele, i) => {
            var timerData = utils.needBindingTimer(nowTime, ele.etime, 0)
            _this.setData({
                ['couponList[' + i + '].showTimer']: timerData.show,
                ['couponList[' + i + '].remainingTime']: timerData.time,
            })
        })
    },
    ///配置定时器
    configTimer(data) {
        let _this = this
        var timers = this.data.timers
        data.forEach((ele, i) => {
            if (ele.showTimer) {
                ///不存在,则创建一个新的计时器
                if (timers[ele.couponId] == undefined) {
                    var timer = setInterval(function() {
                        let itemData = _this.data.couponList[i]
                        let remainingTime = itemData.remainingTime - 1000
                        if (remainingTime <= 0) {
                            ///定时器结束
                            _this.timerFinish(itemData, i)
                            return
                        }
                        _this.setData({
                            ['couponList[' + i + '].remainingTime']: remainingTime
                        })
                    }, 1000)
                    _this.setData({
                        ['couponList[' + i + '].timer']: timer
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
    ///定时器结束
    timerFinish: function(item, i) {
        clearInterval(item.timer)
        this.setData({
            ['couponList[' + i + '].showTimer']: false,
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
})