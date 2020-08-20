import api from 'api/api';

App({
    onLaunch: function() {
        this.getSystemInfo();
    },

    getSystemInfo() {
        this.globalData.systemInfo = wx.getSystemInfoSync();
    },

    getElementHeight(cssClass) {
        return new Promise((reslove, reject) => {
            wx.createSelectorQuery().select(cssClass).boundingClientRect(function(r) {
                reslove(r.height);
            }).exec();
        });
    },

    globalData: {
        userInfo: null,
        systemInfo: null,
        URL: 'https://xjs.xiujianshen.com',
        webUrl: "https://applet.show-fitness.com",
        imgURL: 'https://static.xiujianshen.com',
        defaultHeadUrl:'http://media.xiujianshen.com/contest/a85d4eface68451ea2bcd871e45a646bf0f433c70893109c572992eec3673ee.png',
        buyCourseNeed: {
            courseId: '',
            upperId: ''
        }
    },

    /*微信request封装 */
    apiRequest(url, data = {}, methods = 'POST', header) {
        var _that = this;
        let promise = new Promise(function(resolve, reject) {
            let userInfo = wx.getStorageSync('userInfo');
            wx.request({
                url: _that.globalData.URL + url,
                data: data, 
                method: methods,
                header: Object.assign({
                    'Content-type': 'application/x-www-form-urlencoded',
                    'auth-token': userInfo ? userInfo.authToken : '',
                    'app-ver': 100040,
                    'Accept-Language': 'zh-CN',
                    'openid': url == '/bean/purchase/payOrder' ? wx.getStorageSync('userInfo').openId : '',
                    'comType': 1 // 判断哪个appid  rc环境 ((默认为健匠,1是秀健内测))  test2环境(默认为秀健内测,1 为新完整版) 正式环境 (默认为极速版,1为新完整版)
                }, header),
                success: function(res) {
                    //接口调用成功
                    if (res.data.code == 402) {
                        wx.setStorageSync('userInfo', undefined);
                        wx.setStorageSync('USERINFO', undefined);
                        if (_that.globalData.userInfo) {
                            _that.globalData.userInfo = undefined;
                        }

                        // wx.showToast({
                        //     title: '登录失效，请重新登录',
                        //     icon: 'none'
                        // });

                        // setTimeout(() => {
                        wx.reLaunch({
                            url: '/pages/index/index'
                        });
                        // }, 1500);
                    }

                    resolve(res); //根据业务需要resolve接口返回的json的数据
                },
                fail: function(res) {
                    // fail调用接口失败
                    reject(res);

                }
            })
        });
        return promise; //注意，这里返回的是promise对象
    },
    getPhoneType() { 
      /// 设备类型 1 iphone 2 android 3 other
      let info = this.getPhoneInfo()
      let system = info.system
      if (system.indexOf("iOS")>=0){
        return 1
      } else if (system.indexOf("Android")>=0) {
        return 2
      }else {
        return 3
      }
    },
    getPhoneInfo() {
        let model;
        wx.getSystemInfo({
            success(res) {
                model = res
            }
        });
        return model
    },
    // 跳转个人主页
    goUserPage(id) {
        if (id == wx.getStorageSync('userInfo').userId) {
            wx.switchTab({
                url: '/pages/my/index/index'
            })
        } else {
            wx.navigateTo({
                url: '/pages/merchant/merchant?userId=' + id,
            })
        }
    },
    // 检查是否登录并做处理
    checkLogin(context, ele) {
        let that = this;
        let promise = new Promise(function(resolve, reject) {
            if (wx.getStorageSync('userInfo') && wx.getStorageSync('userInfo').authToken) { // 登录状态
                resolve({code: 3}); //根据业务需要resolve接口返回的json的数据
            } else { // 未登录状态  展示弹框
                // resolve();  // fail调用接口失败
                that.showLoginMask(context, ele, resolve)
            }
        })
        return promise;
    },
    
    // 判断当前用户是否登录
    judgeIsLogin() {
        if (wx.getStorageSync('userInfo') && wx.getStorageSync('userInfo').authToken) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * context: 指向 this
     * ele: 元素 id或者class
     * res: {
     *      code: 1 // 取消登录 2 失败 3成功
     * }
     */
    showLoginMask(context, ele, fn) {
        context.selectComponent(ele).openLogin().then(res => {
            if (fn) {
                fn(res)
            }
        });
    },
})