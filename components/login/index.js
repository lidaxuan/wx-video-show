/* 
 * 用户信息放在locanStorage的userInfo中，用来判断用户是否登录
 */

import regeneratorRuntime from '../../utils/runtime'
const app = getApp();
import api from '../../api/api';

Component({
    data: {
        show: '',
        hasSignUp: true,
        resolve: null
    },

    pageLifetimes: {
        show() {
            // 存储当前页面地址
            let pages = getCurrentPages();
            let currentPage = pages[pages.length - 1];
            let page = '/' + currentPage.route;
            let options = currentPage.options;

            let keys;
            let option = '?';
            if (options && Object.keys(options).length) {
                keys = Object.keys(options);
                let option = '?';
                keys.forEach(key => {
                    option += key + '=' + options[key] + '&';
                });
                app.globalData.jumpUrl = page + option.slice(0, -1);
            } else {
                app.globalData.jumpUrl = page;
            }
            this.init();
        }
    },

    methods: {
        // async init() {
        //     if (app.judgeIsLogin()) {
        //         this.checkFirstEnter();
        //     }
        // },

        // async init() {
        //     if (app.judgeIsLogin()) {
        //         if (wx.getStorageSync('checkFirstEnter') != true)
        //             this.checkFirstEnter();
        //     }
        // },

        async init() {
            if (app.judgeIsLogin()) {
                this.checkFirstEnter();
            }
        },

        openLogin() {
            let _this = this;
            return new Promise((resolve, reject) => {
                // 检查用户是否已经注册，用来判断显示哪个按钮
                wx.showLoading({
                    title: '请稍候',
                    mask: true
                });
                _this.checkUserStatus();
                _this.setData({
                    show: 'show'
                });

                _this.data.resolve = resolve;
            });
        },

        // 检查用户是否已经注册
        checkUserStatus() {
            wx.login({
                success: r => {
                    app.apiRequest(api.wxLogin, {
                        code: r.code
                    }).then((r) => {
                        wx.hideLoading();
                        // 已经存在用户信息
                        if (r.data.code == 0) {
                            return app.globalData.userInfo = r.data.data;
                        } else if (r.data.code == 1) { // 需要绑定手机号
                            app.globalData.openId = r.data.data.openId;
                        } else {
                            wx.showToast({
                                title: r.data.message,
                                icon: 'none'
                            });
                        }

                        this.setData({
                            hasSignUp: false
                        }, () => {
                            wx.hideLoading();
                        });
                    }).catch(err => {
                        wx.hideLoading();
                        wx.showToast({
                            title: err,
                            icon: 'none'
                        });
                    });
                }
            });
        },

        // 点击普通登录按钮
        login() {
            wx.showLoading({
                title: '正在登录',
                mask: true
            });
            // 统计
            wx.reportAnalytics('login_regisered_wechat', {});

            wx.setStorageSync('userInfo', app.globalData.userInfo);
            this.checkFirstEnter();
            // 登录成功统计
        },

        // 授权
        async wxLogin(e) {
            wx.showLoading({
                title: '请稍候',
                mask: true
            });

            wx.reportAnalytics('login_new_wechat', {});

            // 拒绝授权
            if (e.detail.errMsg.indexOf('fail') > -1) {
                wx.hideLoading();
                wx.showToast({
                    title: '需要您的手机号才能登录秀健身小程序',
                    icon: 'none',
                    duration: 4000
                });
                // 下面调用了resolve，再次点击登录时resolve已经失效了
                // 所以隐藏弹窗，以再次返回新的promise，下同
                this.setData({
                    show: ''
                });
                // 登录失败
                return this.data.resolve({
                    code: 2
                });
            }

            // 同意授权，解密手机号
            let d = await this.decryptPhone(e.detail.encryptedData, e.detail.iv);
            if (d != 0) {
                wx.hideLoading();
                // wx.showToast({
                //     title: '获取手机号码失败:' + d,
                //     icon: 'none',
                //     duration: 3000
                // });
                // 登录失败
                this.setData({
                    show: ''
                });
                return this.data.resolve({
                    code: 2
                });
            }

            // 手机号解密成功，绑定手机号、完善其他个人信息
            // (微信登录使用手机号作为用户名，默认头像作为头像)
            // openLogin方法已经得知没有当前用户信息
            let usr = await this.appletBindingPhone();
            // 绑定手机号失败
            if (usr != 0) {
                wx.hideLoading();
                this.setData({
                    show: ''
                });
                return wx.showToast({
                    title: usr,
                    icon: 'none'
                });
            }

            // 绑定手机号成功，检查是否完成问卷
            wx.setStorageSync('userInfo', app.globalData.userInfo);
            return this.checkFirstEnter();
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

                    resolve(r.data.message);
                }).catch(err => {
                    resolve(err);
                });
            });

        },

        // 绑定手机号
        appletBindingPhone() {
            let param = {
                openKey: app.globalData.openId,
                type: 5,
                phone: app.globalData.phoneNumber,
                nick: app.globalData.phoneNumber,
                gender: 1,
                head: app.globalData.defaultHeadUrl,
            };
            // 绑定手机号 传 课程id  upperid
            if (wx.getStorageSync('bindingPhoneParam')) {
                let bindingPhoneParam = wx.getStorageSync('bindingPhoneParam')
                console.log(bindingPhoneParam)

                if (bindingPhoneParam.upperId) {
                    let upperId = parseInt(bindingPhoneParam.upperId);
                    if (upperId && typeof upperId != 'undefined' && typeof upperId != 'null') {
                        param.upperId = upperId;
                    }
                }
                if (bindingPhoneParam.courseId) {
                    param.courseId = bindingPhoneParam.courseId
                }
            }

            return new Promise((resolve, reject) => {
                app.apiRequest(api.appletBindingPhone, param).then(r => {
                    if (r.data.code == 0) {
                        app.globalData.userInfo = r.data.data;
                        return resolve(0);
                    }

                    resolve(r.data.message);
                }).catch(err => {
                    resolve(err);
                });
            });
        },

        // 检查是否完成问卷
        checkFirstEnter() {
            app.apiRequest(api.checkFirstEnter, {}, 'GET', {
                'auth-token': app.globalData.userInfo ? app.globalData.userInfo.authToken : wx.getStorageSync('userInfo').authToken
            }).then(r => {
                // 已完成问卷，隐藏登录窗口
                if (r.data.data > 0) {
                    wx.hideLoading();
                    wx.setStorageSync('checkFirstEnter', true);
                    this.setData({
                        show: ''
                    });
                    // 登录成功统计
                    // wx.reportAnalytics('loginsuccess_questioncomplete', {});
                    // 登录成功
                    return typeof this.data.resolve == 'function' && this.data.resolve({
                        code: 3
                    });
                }

                // 登录成功 需填写问卷 统计
                wx.reportAnalytics('login_noneedquestion', {});
                // 未完成问卷，跳转问卷
                wx.navigateTo({
                    url: `/pages/login/init/index?from=${app.globalData.jumpUrl}`
                });
            }).catch(err => {
                return wx.showToast({
                    title: err.toString(),
                    icon: 'none',
                    duration: 4000
                });
            });
        },

        cancel() {
            this.setData({
                show: ''
            });

            this.data.resolve({
                code: 1
            });
        }
    }
})