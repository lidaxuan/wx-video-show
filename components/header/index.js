let app = getApp();

Component({
    properties: {
        hideBack: Number, // 1: 隐藏返回按钮
        hideHome: Number, // 1: 隐藏首页按钮
        title: String
    },

    data: {
        width: 180,
        paddingTop: 50
    },

    lifetimes: {
        attached: function() {
            // 注释见search组件
            let pzn = wx.getMenuButtonBoundingClientRect();
            let pixelRatio = 750 / app.globalData.systemInfo.screenWidth
            let paddingTop = pzn.top - (60 / pixelRatio - pzn.height) / 2;
            let width = app.globalData.systemInfo.screenWidth - pzn.width * 2 - ((app.globalData.systemInfo.screenWidth - pzn.right) * 4);
            this.setData({
                paddingTop,
                width
            });
        },
    },

    methods: {
        back() {
            if (getCurrentPages().length == 1) {
                return;
            }

            wx.navigateBack({
                delta: 1
            });
        },

        home() {
            wx.switchTab({
                url: '/pages/index/index'
            });
        }
    }
})