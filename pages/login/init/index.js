import regeneratorRuntime from '../../../utils/runtime'
const app = getApp();
import api from '../../../api/api';

Page({
    data: {
        headerHeight: 0,
        list: null,
        fromUrl: null,
        isEdit: 0,
        width: 180,
        paddingTop: 50
    },

    onLoad: function(options) {
        this.data.fromUrl = options.from;
        this.data.isEdit = options.edit ? 1 : 0;

        if (this.data.isEdit == 0) {
            wx.showToast({
                title: '请完成小问卷',
                icon: 'none'
            });
        }

        this.getList();
        // 统计
        wx.reportAnalytics('login_question', {});

        let pzn = wx.getMenuButtonBoundingClientRect();
        let pixelRatio = 750 / app.globalData.systemInfo.screenWidth
        let paddingTop = pzn.top - (60 / pixelRatio - pzn.height) / 2;
        let width = app.globalData.systemInfo.screenWidth - pzn.width * 2 - ((app.globalData.systemInfo.screenWidth - pzn.right) * 4);
        this.setData({
            paddingTop,
            width
        }, () => {
            this.getElementHeight();
        });
    },

    async getElementHeight() {
        let h = await app.getElementHeight('.header');
        this.setData({
            headerHeight: h
        });
    },

    getList() {
        let _this = this;
        app.apiRequest(api.askrollList, {}, 'GET', {
            'auth-token': app.globalData.userInfo ? app.globalData.userInfo.authToken : wx.getStorageSync('userInfo').authToken
        }).then(r => {
            // 已完成问卷，隐藏登录窗口
            if (r.data.code == 0) {
                this.setData({
                    list: r.data.data
                });

                if (this.data.isEdit) {
                    this.getAskrollDetails();
                }

                return;
            }

            wx.showToast({
                title: '获取问卷数据失败，请稍后重试(0)',
                icon: 'none'
            });
        }).catch(err => {
            wx.showToast({
                title: '获取问卷数据失败，请稍后重试(1)',
                icon: 'none'
            });
        });
    },

    itemTap(e) {
        let dataset = e.currentTarget.dataset;
        let group = this.data.list[dataset.index];
        let accept = group.accept;
        let item = group.options[dataset.subindex];

        if (accept == 1) {
            this.clearAndSelect(group.options, item);
        } else {
            // 取消选择
            if (item.selected == true) {
                item.selected = false;
                return this.setData({
                    list: this.data.list
                });
            }

            // 获取该组选中总数
            let selected = 0;
            group.options.forEach(i => {
                if (i.selected == true) {
                    selected++;
                }
            });

            if (selected >= accept) {
                return wx.showToast({
                    title: '最多选择' + accept + '个选项哦～请先取消一个选项',
                    icon: 'none'
                });
            }

            item.selected = true;
            this.setData({
                list: this.data.list
            });
        }


        item.selected = true;

        this.setData({
            list: this.data.list
        });
    },

    // 清除一组的选中状态，并选中指定项
    clearAndSelect(list, item) {
        list.forEach(item => {
            item.selected = false;
        });
        item.selected = true;

        this.setData({
            list: this.data.list
        });
    },

    submit() {
        let noSelect = true,
            ids = [],
            options = [];

        for (let i = 0, len = this.data.list.length; i < len; i++) {
            noSelect = true;
            options = [];
            for (let j = 0, l = this.data.list[i].options.length; j < l; j++) {
                if (this.data.list[i].options[j].selected == true) {
                    noSelect = false;
                    options.push(this.data.list[i].options[j].value);
                }
            }
            if (noSelect) {
                break;
            }
            ids.push({
                type: this.data.list[i].type,
                options: options
            });
        }

        if (noSelect) {
            return wx.showToast({
                title: '请完整填写问卷',
                icon: 'none'
            });
        }

        wx.showLoading({
            title: '正在保存'
        });

        app.apiRequest(api.askrollSave, {
            options: JSON.stringify(ids)
        }).then(r => {
            // 已完成问卷，隐藏登录窗口
            if (r.data.code == 0) {
                // 统计
                wx.reportAnalytics('login_init_complete', {
                    rk: this.data.isEdit
                });


                if (this.data.isEdit == 1) {
                    wx.navigateBack({
                        delta: 2
                    });
                } else {
                    wx.setStorageSync('checkFirstEnter', true);
                    wx.reLaunch({
                        url: app.globalData.jumpUrl ? app.globalData.jumpUrl : '/pages/index/index'
                    });
                }

                return;
            }

            wx.showToast({
                title: r.data.message,
                icon: 'none'
            });
        }).catch(err => {
            wx.showToast({
                title: '保存问卷数据失败，请稍后重试(1)',
                icon: 'none'
            });
        });
    },

    getAskrollDetails() {
        app.apiRequest(api.askrollDetails, {}, 'GET').then(r => {
            if (r.data.code != 0) {
                return wx.showToast({
                    title: '获取问卷数据失败，请稍后重试(2)',
                });
            }

            if (!r.data.data.length) {
                return;
            }

            r.data.data.forEach(item => {
                for (let i = 0, len = this.data.list.length; i < len; i++) {
                    if (item.type == this.data.list[i].type) {
                        this.data.list[i].options.forEach(x => {
                            if (item.options.indexOf(x.value) > -1) {
                                x.selected = true;
                            }
                        });
                        break;
                    }
                }
            });

            this.setData({
                list: this.data.list
            });
        }).catch(err => {
            wx.showToast({
                title: '获取问卷数据失败，请稍后重试(3)',
                icon: 'none'
            });
        });
    },

    back() {
        wx.reLaunch({
            url: '/pages/index/index'
        });
    }
})