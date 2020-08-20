// pages/webView/index.js
const app = getApp ();

Page ({
  /**
     * 页面的初始数据
     */
  data: {
    url: '',
    token: '',
  },

  /**
     * 生命周期函数--监听页面加载
     */
  onLoad: function (options) {
    let _this = this;
    const eventChannel = _this.getOpenerEventChannel ();
    // 监听webViewEvent事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on ('webViewEvent', function (data) {
      console.log (data);
      _this.requetWebUrl (data);
    });
  },
  onShow: function () {},
  requetWebUrl: function (data) {
    console.log (data);
    if (data.url == undefined || !data.url) return;
    this.setData ({
      url: app.globalData.webUrl + data.url,
    });
    ///设置标题
    wx.setNavigationBarTitle ({
      title: data.title,
    });
    this.setData ({
      token: wx.getStorageSync ('userInfo').authToken,
    });
  },
  recieveWebMessage: function (data) {
    console.log ('打印一下data', data.detail.data);
    wx.setStorageSync ('examFinishParam', data.detail.data[0]);
  },
});
