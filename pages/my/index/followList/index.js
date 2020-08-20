Component({
    properties: {
        list: Array
    },

    methods: {
        toFriend(e) {
            // 自己
            if (e.currentTarget.dataset.userid == wx.getStorageSync('userInfo').userId) {
                return wx.navigateTo({
                    url: '/pages/my/index/index'
                });
            }

            // 商家
            if (e.currentTarget.dataset.authtype == 2 || e.currentTarget.dataset.authtype == 3) {
                return wx.navigateTo({
                    url: '/pages/merchant/merchant?userId=' + e.currentTarget.dataset.userid
                });
            }

            // ta的
            wx.navigateTo({
                url: '/pages/my/friend/index?userid=' + e.currentTarget.dataset.userid
            });
        }
    }
})