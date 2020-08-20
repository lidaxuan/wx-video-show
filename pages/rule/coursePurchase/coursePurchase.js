// pages/fullScreenVideo/fullScreenVideo.js
const app = getApp();
var WxParse = require('../../../wxParse/wxParse.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        courseId: '',
        courseRuleInfo: '',
        paddingTop: 0,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (opt) {
        this.setData({
            courseId: opt.courseId
        })
        this.getData(opt.courseId);
        this.getPaddingTopFn();
    },

    getData(courseId) {
        let that = this;
        app.apiRequest('/course/cert/ruletext', {
            courseId: courseId,
            format: 2
        }, 'get').then(res => {
            if (res.data.code == 0) {
                this.setData({
                    courseRuleInfo: res.data.data
                })
                WxParse.wxParse('article', 'html', that.data.courseRuleInfo, that);
            }
        })
    },
    // 获取元素高度
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.header').boundingClientRect(function (rects) {
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
    },
})