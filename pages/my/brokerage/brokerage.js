// pages/my/brokerage/brokerage.js
const app = getApp();
import api from '../../../api/api';
Page({
    // {
    //     "brokerageType": "SECOND_LEVEL",
    //     佣金类型 CASH: 兑现(此状态金额前面添加负号) RECOMMENDATION: 推荐商家返佣 FIRST_LEVEL: 一级佣金 SECOND_LEVEL: 二级佣金 "productTitle": "v2测试",
    //     课程名称 直接展示 "benefit": "0.01",
    //     佣金数额 "status": 4,
    //     状态 "createdAt": "2019-08-14 10:40:33",
    //     时间 "content": "二级佣金",
    //     佣金类型直接展示 "detail": "一级 介绍 澉约 购买"
    //     购买人相关文案 直接展示
    // }
    data: {
        paddingTop: 0,
        pageSize: 10,
        pageIndex: 1,
        totalMoney: 0, //总余额
        merchantCount: 0, //邀请的商家数量
        lowerCount: 0, //邀请的好友数量
        dataList: [], //明细列表数据
        balance: 0, //佣金余额
    },

    onLoad: function(options) {
        this.getPaddingTopFn();
        this.getTotalMoney(); //获取余额
        this.getInvitedCount(); //获取邀请的数量
        this.getList(); //获取明细列表
    },

    onReachBottom: function() {
        this.getList();
    },
    getTotalMoney() {
        app.apiRequest(api.totalMoney, null, "get").then(res => {
            if (res.data.code == 0) {
                this.setData({
                    totalMoney: res.data.data.balance
                })
            }
        })
    },
    getPaddingTopFn() {
        let that = this;
        wx.createSelectorQuery().selectAll('.page-header').boundingClientRect(function(rects) {
            that.setData({
                paddingTop: rects[0].height,
            })
        }).exec();
    },
    getInvitedCount() { //获取邀请的数量
        app.apiRequest(api.invitedCount, null, "get").then(res => {
            if (res.data.code == 0) {
                this.setData({
                    merchantCount: res.data.data.merchantCount,
                    lowerCount: res.data.data.lowerCount
                })
            } else {
                wx.showLoading({
                    title: JSON.stringify(res.data.code + ':' + res.data.message),
                    duration: 2000
                })
            }
        })
    },
    getList() { //获取明细列表
        let that = this;
        app.apiRequest(api.brokerageList, {
            pageSize: that.data.pageSize,
            pageIndex: that.data.pageIndex
        }, "get").then(res => {
            if (res.data.code == 0) {
                if (that.data.pageIndex == 1) {
                    that.setData({
                        dataList: res.data.data,
                    })
                } else {
                    that.setData({
                        dataList: that.data.dataList.concat(res.data.data)
                    })
                }
                if (res.data.data != null && res.data.data.length > 0) { //本次请求有数据page++
                    that.setData({
                        pageIndex: that.data.pageIndex + 1
                    })
                }
            }
        })
    },
    toInvited(event) { //跳转到邀请列表
        let typefrom = event.currentTarget.dataset.type;
        wx.navigateTo({
            url: '/pages/my/invited/index?typefrom=' + typefrom
        });
    }
})