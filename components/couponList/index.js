import utils from "../../utils/util.js";

Component({
    properties: {
        backgroundColor: String,
        dataList: Array,
        couponType: Number ///0 未使用 1 已使用 2已过期
    },

    data: {
        timers: {} ///定时器数组
    },
    observers: {
        'dataList': function(data) {
            this.clearTimers()
            this.bindingTimerData(data)
        }
    },
    lifetimes: {
        attached: function() {
            this.configData(this.data.dataList)
        },
        detached: function() {
            this.clearTimers()
        }
    },
    pageLifetimes: {
        show: function() {
            // if(!this.data.timers){
            this.bindingTimerData(this.data.dataList)
            // }
        },
        hide: function() {
            this.clearTimers()
        }
    },
    methods: {
        clickUse: function(e) {
            let courseId = e.currentTarget.dataset.item.productId
            wx.navigateTo({
                url: "/pages/course/courseInfo/courseInfo?courseId=" + courseId
            });
        },
        ///配置data
        configData: function(data) {
            let timerType = this.data.couponType == 0
            let _this = this
            let nowTime = new Date().getTime()
            data.forEach((ele, i) => {
                var timerData = utils.needBindingTimer(nowTime, ele.etime, 0)
                _this.setData({
                    ['dataList[' + i + '].showTimer']: timerData.show && timerType,
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
                    ///不存在,则创建一个新的计时器 (使用couponId拼接useType作为唯一的key)
                    let couponTimerKey = ele.couponId + ele.useType
                    if (timers[couponTimerKey] == undefined) {
                        _this.logTimerCount()
                        var timer = setInterval(function() {
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
                        timers[couponTimerKey] = timer
                    }
                }

            })
            _this.setData({
                timers: timers
            })
        },
        ///根据数据绑定定时器
        bindingTimerData: function(data) {
            if (this.properties.couponType != 0) {
                return
            }
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
            ///todo


        },
        ///清除计时器
        clearTimers: function() {
            for (let key in this.data.timers) {
                clearInterval(this.data.timers[key])
            }
            this.setData({
                timers: {}
            })
        }
    },

})