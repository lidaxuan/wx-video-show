import regeneratorRuntime from '../../utils/runtime';
const app = getApp();
import api from '../../api/api';

Page({
    data: {
        headerHeight: 0,
        courseListTitieActiveIndex: 0,
        recommendedUsers: [], ///推荐用户
        courseFeeList: [], ///推荐精选课
        courseFreeList: [], //推荐公开课
        inputTxt: '',
        searchResult: [],
        showSearchResult: false,
        searchPageIndex: 1,
        isIos :true
    },

    onLoad: function(options) {
        this.setData({
          isIos: app.getPhoneType() == 1
        })
        this.getElementHeight();
        this.getRecommandUsers()
        this.getCourseCl();

        wx.reportAnalytics('viewsearch', {});
    },
    onShow:function(){
      this.getElementHeight();
    },
    async getElementHeight() {
        let h = await app.getElementHeight('.header');
        this.setData({
            headerHeight: h
        });
    },

    switchCourseList(e) {
        let index = e.currentTarget.dataset.index - 0
        this.setData({
            courseListTitieActiveIndex: index,
        });
        switch (index) {
            case 0:
                if (this.data.courseFeeList.length == 0) {
                    this.getCourseCl()
                }
                break
            case 1:
                if (this.data.courseFreeList.length == 0) {
                    this.getCourseCl()
                }
                break
            default:
        }
    },
    ///获取推荐商家
    getRecommandUsers() {
        app.apiRequest("/auth/mainStoreInfos", {}, "get").then(res => {
            if (res.data.code == 0) {
                let users = res.data.data
                users.forEach((ele, i) => {
                    ele.relation = 0
                })
                console.log(users)
                this.setData({
                    recommendedUsers: users
                })
                ///获取关注状态
                this.getUsersRelation()
            }
        })
    },
    ///批量获取商家关注状态 
    getUsersRelation() {
        if (!app.judgeIsLogin()) return
        let _this = this
        let userIds = []
        this.data.recommendedUsers.forEach((ele, i) => {
            userIds.push(ele.id)
        })
        let userIdsStr = userIds.join(',')
        console.log(userIdsStr)
        app.apiRequest("/social/relation/relationstatus", {
            otherId: userIdsStr
        }, "get").then(res => {
            let data = res.data.data
            if (res.data.code == 0) {
                ///把拿到的关系 赋值到本地数组
                data.forEach((ele, i) => {
                    _this.data.recommendedUsers.forEach((item, j) => {
                        if (ele.otherId == item.id) {
                            _this.setData({
                                ['recommendedUsers[' + j + '].relation']: ele.relation
                            })
                        }
                    })
                })
            }
        })
    },
    ///获取推荐课程(精选课,公开课)
    getCourseCl() {
        ///需要精选课的条数
        var isFee = this.data.courseListTitieActiveIndex == 0
        app.apiRequest(api.courseCl, {
            // fil: 1,
            pageSize: 5,
            free: isFee ? 0 : 5,
            duration: 0
        }).then(r => {
            if (r.data.code == 0) {
                if (isFee) {
                    this.setData({
                        courseFeeList: r.data.data
                    });
                } else {
                    this.setData({
                        courseFreeList: r.data.data
                    });
                }
            }
        }).catch(err => {});
    },
    _search(resetPageIndex) {
        if (!this.data.inputTxt) {
            wx.showToast({
                title: '请输入课程',
                icon: 'none',
                duration: 2000
            });
            return
        }
        wx.showLoading({
            title: '搜索中'
        });

        if (!resetPageIndex) {
            this.data.searchPageIndex = 1;
        } else {
            this.data.searchPageIndex += 1;
        }

        app.apiRequest(api.search, {
            // fil: 1,
            keyword: this.data.inputTxt, // == '' ? '' : this.data.inputTxt.replace(/[付|费|课|程|ke|课]/g, ''),
            pageSize: 20,
            pageIndex: this.data.searchPageIndex
        }, 'POST', {
            'Content-type': 'application/json'
        }).then(r => {
            setTimeout(() => {
                wx.hideLoading();
            }, 200);

            if (r.data.code == 0) {
                let data = r.data.data
                wx.reportAnalytics('searchcomplete', {
                  searchresult: data.length ? data.length : 0
                });

              if (!data.length) {
                    // 到底加载，搜索为空，也继续保留数据
                    // 正常搜索，结果为空，清空searchResult，显示nodata提示
                    if (!resetPageIndex) {
                        this.setData({
                            searchResult: []
                        });
                        wx.showToast({
                            title: '没有搜索到课程',
                            icon: 'none',
                            duration: 2000
                        });
                    }
                    return;
                }

                // 到底加载，searchResult追加新数据
                // 正常搜索，searchResult重新赋值
                this.setData({
                  searchResult: resetPageIndex ? this.data.searchResult.concat(data) : data,
                    showSearchResult: true
                });
            } else {
                wx.showToast({
                    title: '没有搜索到课程',
                    icon: 'none',
                    duration: 2000
                });
            }
        }).catch(err => {});
    },

    input(e) {
        // 点击软键盘的搜索后，input再次获得焦点，
        // 软键盘弹出后，点击clear，会触发input事件
        // 但是e.detail中没有keyCode和cursor
        // if (!e.detail.keyCode) {
        //     return;
        // }

        this.setData({
            inputTxt: e.detail.value
        });
    },

    search() {
        this._search();
    },

    onReachBottom() {
        this.data.showSearchResult && this._search(1);
    },

    cancel() {
        this.setData({
            searchResult: [],
            showSearchResult: false
        });
    },

    clear() {
        console.log('clear');
        this.setData({
            inputTxt: ''
        });
    },
    ///关注
    focusClick(e) {
        let _this = this
        app.checkLogin(this, "#login").then(res => {
            if (res.code == 3) {
                var index = e.currentTarget.dataset.index - 0
                //to do
                var user = _this.data.recommendedUsers[index]
                var relation = user.relation ? 0 : 1
                _this.setData({
                    ['recommendedUsers[' + index + '].relation']: relation
                })
                console.log(_this.data.recommendedUsers[index].relation)
                app.apiRequest(api.focus, {
                    otherId: user.id,
                    relation: relation,
                    ftype: 0
                }).then(r => {
                    if (r.data.code == 0) {
                        _this.setData({
                            ['recommendedUsers[' + index + '].relation']: r.data.data - 0
                        })
                    }
                })
            }
        })
    },
    userClick(e) {
        let index = e.currentTarget.dataset.index
        let user = this.data.recommendedUsers[index]
        app.goUserPage(user.id);
    },
    toCourse(e) {
        wx.reportAnalytics('search_click', {
            clickfrom: e.currentTarget.dataset.click
        });

        app.globalData.courseid = e.currentTarget.dataset.id;
        let type = e.currentTarget.dataset.type;
        if (type == 1) {
            ///公开课列表
            wx.navigateTo({
                url: "/pages/openClass/index?courseId=" + e.currentTarget.dataset.id
            });
        } else if (type == 2) {
            ///收费课详情
            wx.navigateTo({
                url: "/pages/course/courseInfo/courseInfo?courseId=" + e.currentTarget.dataset.id
            });
        }
    }
})