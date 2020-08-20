const app = getApp();
import api from '../../api/api';

Component({
    // "id": 42800,
    // "title": "哈士奇专家课", //课程标题
    // "lessonCon": 22, //课节数
    // "cover": "我是课程封面~飒", //课程封面
    // "price": 40, //课程价格
    // "pv": 0, //感兴趣
    // "ppv": 100, //播放量
    // "cfType": 2, //1.免费  2.收费
    // "type": 2, //1.普通课程  2.认证课程(有证书)
    // "duration": 180 //视频时长
    // "couponState": 1, //优惠券标识：1：存在广告券、2:不存在广告券
    // "lecturerInfo": [ //讲师信息
    //     {
    //         "name": "林道伟",
    //         "labe": "IFBB高级营养师"
    //     },
    //     {
    //         "name": "刘垚",
    //         "labe": "高级运动营养师"
    //     },
    //     {
    //         "name": "王柯珩",
    //         "labe": "全能培训导师"
    //     },
    //     {
    //         "name": "王龙绘",
    //         "labe": "全能培训导师"
    //     },
    //     {
    //         "name": "赵犇",
    //         "labe": "国家级运动员"
    //     }
    // ]

    //对外数据
    properties: {
        userId: { //商家(用户))id
            type: Number,
            value: -1
        },
        list: { //外部有数据
            type: Object
        },
        fromMyCourse: {
            type: Boolean,
            value: false
        },
        needReresh: Boolean///需要刷新
    },
    observers: {
        'needReresh': function (need) {
            if (need) {
                this.setData({
                    pageIndex: 1,
                })
                this.getData();
            }
        }
    },
    data: { //私有数据
        dataList: [], //课程列表
        firstSortValue: 0, //请求下一页的数据
        pageIndex: 1, //页码
        merchantId: -1, //商家id
        worth: 1, //-1 全部      0免费     1收费  
        paddingTop: 0,
        paddingBottom: 0,
        nowTime: 0, //当前时间戳
        courseId: -1, //课程id
        refreshing: false, //是否正在刷新
        isIos: true,
        noData: false,
    },
    lifetimes: {
        attached: function () {
            this.setData({
                nowTime: Date.parse(new Date()),
                isIos: app.getPhoneType() == 1
            })

        },
        ready: function () {
            wx.showLoading({
                title: '正在加载中',
            })
            this.setData({
                merchantId: this.properties.userId,
            })
            if (this.properties.list != null && this.properties.list.length > 0 || this.data.fromMyCourse) { //我的课架从外部请求接口

                wx.hideLoading()
            } else { //其它页面自己请求接口
                this.getData();
            }
        },
        moved: function () { },
        detached: function () { }
    },

    methods: {
        getData: function () { //获取课程列表接口数据(或加载更多)
            let that = this;
            let data = this.data.merchantId == -1 ? { //没有商家号
                firstSortValue: this.data.firstSortValue,
                pageSize: 10,
                pageIndex: this.data.pageIndex,
                worth: this.data.worth
            } : { //有商家号
                    firstSortValue: this.data.firstSortValue,
                    pageSize: 10,
                    pageIndex: this.data.pageIndex,
                    merchantId: this.data.merchantId,
                    worth: this.data.worth
                };

            //接口请求
            app.apiRequest(api.courseList, data, "get").then(res => {
                wx.hideLoading()
                if (res.data.code == 0) {
                    if (res.data.data == null || res.data.data.list == null || res.data.data.list.length <= 0) {
                        that.setData({
                            refreshing: false,
                            noData: that.data.dataList.length <= 0
                        })
                        if (that.data.refreshing) { //刷新成功
                          wx.showLoading({
                            title: "刷新成功",
                            duration: 1000
                          })
                          this.triggerEvent('stoprefresh', null, null); //通知上级Page停止刷新
                        }
                        return
                    }
                    if (that.data.pageIndex == 1) { //第一页数据
                        that.setData({
                            dataList: res.data.data.list,
                        });
                        if (that.data.refreshing) { //刷新成功
                            wx.showLoading({
                                title: "刷新成功",
                                duration: 1000
                            })
                            this.triggerEvent('stoprefresh', null, null); //通知上级Page停止刷新
                        }
                    } else { //非第一页数据
                        that.setData({
                            dataList: that.data.dataList.concat(res.data.data.list), //拼接list
                        });
                    }
                    that.setData({
                        firstSortValue: res.data.data.firstSortValue,
                        pageIndex: that.data.pageIndex + 1
                    });
                } else {
                    if (that.data.refreshing) {
                        wx.showLoading({
                            title: "刷新失败",
                            duration: 1000
                        })
                        this.triggerEvent('stoprefresh', null, null); //通知上级Page停止刷新

                    } else {
                        wx.showLoading({
                            title: JSON.stringify(res.data.code + ':' + res.data.message),
                            duration: 2000
                        })
                    }
                }
                that.setData({
                    refreshing: false,
                    noData: that.data.dataList.length <= 0
                })
            }).catch(error => {
                wx.hideLoading()
                // handle error
                that.setData({
                    refreshing: false,
                    noData: that.data.dataList.length <= 0
                })
            })
        },
        getPaddingTopFn() { //获取头部高度
            let that = this;
            wx.createSelectorQuery().selectAll('.container').boundingClientRect(function (rects) {
                that.setData({
                    paddingTop: rects[0].height,
                    paddingBottom: app.globalData.systemInfo.statusBarHeight
                })
            }).exec();
        },
        errImg: function (e) { //图片加载失败后事件
            let index = e.target.dataset.index;
            this.data.dataList[index].cover = "/static/img/img-default-icon.png";
            this.setData({
                dataList: this.data.dataList
            });
        },
        jumpToCourseInfo: function (e) { //跳转到课程详情|公开课列表
            this.setData({
                courseId: e.currentTarget.dataset.courseId
            });

            app.globalData.courseid = e.currentTarget.dataset.courseId;

            wx.navigateTo({
                url: "/pages/course/courseInfo/courseInfo?courseId=" + this.data.courseId
            });
        },
        refreshList: function () { //刷新当前列表
            this.setData({
                pageIndex: 1,
                refreshing: true
            });
            this.getData();
        }
    }
})