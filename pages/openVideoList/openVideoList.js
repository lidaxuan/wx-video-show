// pages/openVideoList/openVideoList.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        paddingTop: 0,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        // this.getData();
        this.getPaddingTopFn();
    },
    // 数据加载
    getData: function() {
        let data = {
            pageSize: 15,
            classifyId: classifyId, // 分类id
            classifyIndex: this.data.classifyIndex, // 上次请求分类数据最后一个课程指针
            courseId: this.data.courseId ? this.data.courseId : ''
        };
        app.apiRequest('/search/foreign/course/classifyCourse', data, 'post').then(res => {
            if (res.data.code == 0) {
                let list = res.data.data.courseInfo;
                list.forEach((ele, i) => {
                    ele.video.transcodeUrl = cryptoJs.decrypt(ele.video.transcodeUrl ? ele.video.transcodeUrl : '')
                })
                if (this.data.previousClassifyId == classifyId) {
                    let newList = this.data.videoList.concat(list);
                    this.setData({
                        videoList: newList
                    });
                } else {
                    this.setData({
                        videoList: list
                    });
                }
                this.getMerchantId()
            } else {
                wx.showLoading({
                    title: res.data.code + ':' + res.data.message,
                    duration: 2000
                })
            }
        })
    },
    getMerchantId() {
        this.setData({
            followIdArr: []
        })
        let followIdArr = this.data.followIdArr;
        this.data.videoList.forEach(ele => {
            followIdArr.push(ele.course.id);
        })
        // console.log(this.data.followIdArr)
        this.getFollow(this.data.followIdArr)
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
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})