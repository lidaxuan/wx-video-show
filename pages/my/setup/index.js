import regeneratorRuntime from '../../../utils/runtime'
const app = getApp();
import api from '../../../api/api';

Page({
    data: {
        headerHeight: 0
    },

    onLoad: function(options) {
        this.getHeaderHeight();
    },
    onShow:function(){
      this.getHeaderHeight();
    },
    async getHeaderHeight() {
        let h = await app.getElementHeight('.header');
        this.setData({
            headerHeight: h
        }, this.fixTabBar);
    },

    logout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success(res) {
                if (res.confirm) {
                    wx.showLoading({
                        title: '正在退出'
                    });

                    app.apiRequest(api.wxUnbundlingThird, {
                        thirdType: 5
                    }).then((r) => {
                        if (r.data.code != 0) {
                            return wx.showToast({
                                title: r.data.message,
                                icon: 'none'
                            });
                        }

                        wx.clearStorageSync();
                        setTimeout(() => {
                            // wx.reLaunch({
                            //     url: '/pages/index/index'
                            // });
                            wx.navigateBack({
                                delta: 1
                            })
                        }, 300);
                    }).catch(err => {
                        wx.showToast({
                            title: JSON.stringify(err)
                        });
                    });
                }
            }
        });
    },

    editAsk() {
        wx.navigateTo({
            url: '/pages/login/init/index?edit=1'
        });
    }
})