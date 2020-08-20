Component({
    properties: {
        list: Array,
        attentionType: Number,
        fromType: String, //区分来源 merchant:来自商家   我的主页my    他的主页 friend
    },

    methods: {
        itemTap: function(e) {
            let item = e.currentTarget.dataset.hi
            let courseId = item.courseId ? item.courseId : item.id;

            getApp().globalData.courseid = courseId;

            if (item.cfType == 1) {
                ///公开课列表
                if (this.properties.fromType == "merchant" || this.properties.fromType == 'my' || this.properties.fromType == 'friend') { //跳转单视频播放
                    wx.navigateTo({
                        url: "/pages/fullScreenVideo/fullScreenVideo?courseId=" + courseId
                    });
                } else { //跳转公开
                    wx.navigateTo({
                        url: "/pages/openClass/index?courseId=" + courseId
                    });
                }

            } else if (item.cfType == 2) {
                ///收费课详情
                wx.navigateTo({
                    url: "/pages/course/courseInfo/courseInfo?courseId=" + courseId
                });
            }

        }
    }
})