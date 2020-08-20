import regeneratorRuntime from '../../../utils/runtime';
const app = getApp();
import api from '../../../api/api';

Page({
    data: {
        headerHeight: 0,
        phone: '',
        vcode: '',
        showClearPhone: false,
        waiting: false,
        countDown: 60,
        hasSignUp: true
    },

    _data: {
        fromUrl: null
    },

    onLoad: function(options) {
        this._data.fromUrl = options.from;
        this.getElementHeight();

        // 上个页面获取了userInfo
        if (!app.globalData.userInfo) {
            this.setData({
                hasSignUp: false
            });
        }
    },

    async getElementHeight() {
        let h = await app.getElementHeight('.header');
        this.setData({
            headerHeight: h
        });
    },

    inputPhone(e) {
        if (e.detail.value != '') {
            this.setData({
                phone: e.detail.value,
                showClearPhone: true
            });
        }
    },

    inputVcode(e) {
        this.setData({
            vcode: e.detail.value,
        });
    },

    clearPhone() {
        this.setData({
            phone: '',
            showClearPhone: false
        });
    },

    getVCode() {
        if (this.data.waiting) {
            return;
        }

        if (this.data.phone == '') {
            return wx.showToast({
                title: '请输入手机号码',
                icon: 'none'
            });
        }

        this.data.waiting = true;

        app.apiRequest(api.getSms, {
            phone: this.data.phone,
            codeType: 2
        }).then(r => {
            if (r.data.code == 0) {
                wx.showToast({
                    title: '发送成功'
                });

                this.setData({
                    waiting: true
                }, () => {
                    this.waiting();
                });

                return;
            }

            this.data.waiting = false;
            return wx.showToast({
                title: r.data.message,
                icon: 'none'
            });
        }).catch(err => {
            this.data.waiting = false;
            wx.showToast({
                title: '验证码发送失败，请稍后重试(1)',
                icon: 'none'
            });
        });
    },

    waiting() {
        setTimeout(() => {
            if (this.data.countDown > 0) {
                this.setData({
                    countDown: --this.data.countDown
                }, () => {
                    this.waiting();
                });
            } else {
                this.setData({
                    waiting: false,
                    countDown: 60
                });
            }
        }, 1000);
    },

    login() {
        if (this.data.phone == '') {
            return wx.showToast({
                title: '请输入手机号码',
                icon: 'none'
            });
        }

        if (this.data.vcode == '') {
            return wx.showToast({
                title: '请输入短信验证码',
                icon: 'none'
            });
        }

        let params = {
            phone: this.data.phone,
            verificationCode: this.data.vcode,
            isH5: 1
        };

        let upperId = wx.getStorageSync('upperId');
        if (upperId) {
            params.upperId = upperId;
        }

        app.apiRequest(api.xjsLogin, params).then(r => {
            if (r.data.code == 0) {
                wx.setStorageSync('userInfo', r.data.data);
                // 统计
                // wx.reportAnalytics('xjslogin_success', {});
                return wx.reLaunch({
                    url: this._data.fromUrl
                });
            }

            wx.showToast({
                title: r.data.message,
                icon: 'none'
            });
        }).catch(err => {
            wx.showToast({
                title: '登录失败，请稍后重试(1)',
                icon: 'none'
            });
        });
    },

    // 点击微信登录按钮
    wxlogin() {
        wx.showLoading({
            title: '正在登录'
        });

        this.checkFirstEnter();
    },

    // 授权
    async wxLogin(e) {
        // 统计
        wx.reportAnalytics('xjslogin_wechat', {});
        wx.showLoading({
            title: '请稍候'
        });

        // 检查是否已经存在用户信息
        let exist = await this.checkLoginStatus();
        if (exist == 0) { // 存在用户信息，检查是否完成问卷
            return this.checkFirstEnter();
        } else if (exist == 2) { // 调用接口错误，不再继续向下执行
            return wx.showToast({
                title: '登录失败，请稍后重试(2)',
                icon: 'none',
                duration: 3000
            });
        }
        console.log(e)
        // 用户拒绝授权
        if (e.detail.errMsg.indexOf('fail') > -1) {
            return wx.showToast({
                title: '需要您的手机号才能登录秀健身小程序',
                icon: 'none',
                duration: 4000
            });
        }

        // 用户同意授权，解密手机号
        let d = await this.decryptPhone(e.detail.encryptedData, e.detail.iv);
        if (d != 0) {
            return wx.showToast({
                title: '获取手机号码失败，请稍后再试',
                icon: 'none',
                duration: 3000
            });
        }

        // 手机号解密成功，并且用户需要绑定手机号、完善其他个人信息
        // 也就是上一步的exist == 1
        // (微信登录使用手机号作为用户名，默认头像作为头像)
        let usr = await this.appletBindingPhone();
        if (usr != 0) {
            return wx.showToast({
                title: '登录失败，请稍后再试(3)',
                icon: 'none',
                duration: 3000
            });
        }

        // 绑定手机号成功，检查是否完成问卷
        return this.checkFirstEnter();
    },

    // 检查用户是否已经注册
    checkLoginStatus() {
        return new Promise((reslove, reject) => {
            wx.showLoading({
                title: '请稍候',
            });
            wx.login({
                success: r => {
                    app.apiRequest(api.wxLogin, {
                        code: r.code
                    }).then((r) => {
                        wx.hideLoading();
                        // 已经存在用户信息
                        if (r.data.code == 0) {
                            app.globalData.userInfo = r.data.data;
                            return reslove(0);
                        }

                        // 需要绑定手机号
                        if (r.data.code == 1) {
                            app.globalData.openId = r.data.data.openId;
                            return reslove(1);
                        }

                        wx.showToast({
                            title: r.data.message,
                            icon: 'none'
                        });

                        return reslove(2);
                    }).catch(err => {
                        wx.hideLoading();
                        wx.showToast({
                            title: err,
                            icon: 'none'
                        });
                        // 容易出现"requert:fail request index out of error"
                        console.log('err----------------', err)
                        return reslove(3);
                    });
                }
            });
        });
    },

    // 解密手机号
    decryptPhone(encryptedData, iv) {
        return new Promise((resolve, reject) => {
            app.apiRequest(api.encrypteddata, {
                openId: app.globalData.openId,
                encryptedData: encryptedData,
                iv: iv
            }).then(r => {
                if (r.data.code == 0) {
                    app.globalData.phoneNumber = JSON.parse(r.data.data).phoneNumber;
                    return resolve(0);
                }

                return resolve(1);
            }).catch(err => {
                resolve(2);
            });
        });

    },

    // 绑定手机号
    appletBindingPhone() {
        return new Promise((resolve, reject) => {
            app.apiRequest(api.appletBindingPhone, {
                openKey: app.globalData.openId,
                type: 5,
                phone: app.globalData.phoneNumber,
                nick: app.globalData.phoneNumber,
                gender: 1,
                head: app.globalData.defaultHeadUrl,
            }).then(r => {
                if (r.data.code == 0) {
                    wx.setStorageSync('userInfo', r.data.data);
                    return resolve(0);
                }

                return resolve(1);
            }).catch(err => {
                resolve(2);
            });
        });
    },

    // 检查是否完成问卷
    checkFirstEnter() {
        app.apiRequest(api.checkFirstEnter, {}, 'GET', {
            'auth-token': app.globalData.userInfo.authToken
        }).then(r => {
            // 已完成问卷
            if (r.data.data != 0) {
                wx.hideLoading();

                wx.setStorageSync('checkFirstEnter', true);
                wx.setStorageSync('userInfo', app.globalData.userInfo);

                return wx.reLaunch({
                    url: this._data.fromUrl
                });
            }

            // 存储当前页面的地址，供问卷完成后跳转
            wx.redirectTo({
                url: `/pages/login/init/index?from=${this._data.fromUrl}`
            });
        }).catch(err => {
            return wx.showToast({
                title: '登录失败，请稍后再试(4)',
                icon: 'none',
                duration: 4000
            });
        });
    },

    toUserAgreement() {},

    toPrivacyPolicy() {}
})