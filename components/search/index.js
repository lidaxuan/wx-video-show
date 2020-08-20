let app = getApp();

Component({
    properties: {

    },

    data: {
        width: 180,
        paddingTop: 50
    },

    lifetimes: {
        attached: function() {
            // 始终让搜索框与胶囊对齐
            let pzn = wx.getMenuButtonBoundingClientRect();
            // app.globalData.systemInfo.pixelRatio不准确
            // 750是小程序默认屏幕宽度
            let pixelRatio = 750 / app.globalData.systemInfo.screenWidth
            // 60是wxss中定义的.input高度，它是input区域的最高高度
            let paddingTop = pzn.top - (60 / pixelRatio - pzn.height) / 2;
            // 152是wxss中.logo的宽度和左右margin
            // 屏幕宽度 - 胶囊宽度 - 胶囊右边距 * 2(留出左右margin) - (logo宽度 + logo左右margin) 
            let width = app.globalData.systemInfo.screenWidth - pzn.width - ((app.globalData.systemInfo.screenWidth - pzn.right) * 2) - (152 / pixelRatio);
            this.setData({
                paddingTop,
                width
            });
        },
    },

    methods: {
        toSearch() {
            wx.navigateTo({
                url: '/pages/search/index'
            });
        }
    }
})