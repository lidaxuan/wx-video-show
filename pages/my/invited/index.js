import regeneratorRuntime from '../../../utils/runtime'
const app = getApp();
import api from '../../../api/api';

Page({
    data: {
        headerHeight: 0,
        pageIndex: 1,
        pageSize: 20,
        list: [],
        typefrom: "", //规定 friend:邀请的好友  merchant:邀请的商家
        title: "", //页面title
        emptymsg: "", //空页面信息
    },

    onLoad: function(options) {
        this.data.typefrom = options.typefrom;
        if (this.data.typefrom == "merchant") {
            this.setData({
                title: "我邀请的商家",
                emptymsg: "暂无邀请的商家"
            })
        } else {
            this.setData({
                title: "我邀请的好友",
                emptymsg: "暂无邀请的好友"
            })
        }
        this.getHeaderHeight();
        wx.showLoading({
          title: '正在加载中',
        })
        this.getData();
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

    getData() {
        let apiUrl = this.data.typefrom == "merchant" ? api.getInvitedMers : api.getFriends;
        app.apiRequest(apiUrl, {
            pageIndex: this.data.pageIndex,
            pageSize: this.data.pageSize
        }, 'GET').then(r => {
          wx.hideLoading()
            if (r.data.code == 0) {
                if (this.data.pageIndex == 1) {
                    this.setData({
                        list: r.data.data,
                    })
                } else {
                    this.setData({
                        list: this.data.list.concat(r.data.data),
                    })
                }
                if (!r.data.data.length) {
                    this.setData({
                        pageIndex: this.data.pageIndex + 1,
                    });
                }
            }
        }).catch(err => {
          wx.hideLoading()
        });
    },

    onReachBottom() {
        this.getData();
    },

    back() {
        wx.navigateBack({

        })
    }
})