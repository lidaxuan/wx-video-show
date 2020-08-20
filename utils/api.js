const app = getApp();
var  inter = {
    // 分享
    shareFn: function(id) {
        app.apiRequest('/course/opt/share', { courseId: id }, 'post').then(res => {
            if (res.data.code == 0) {

            } else {
                
            }
        }).catch(error => {
            wx.showToast({
                title: "JSON.stringify(res.code + ':' + res.message)",
                duration: 2000
            })
        })
    },
    // 收藏
    collectFn: function(id, opt) {
        app.apiRequest('/course/opt/collect', { courseId: id, opt }, 'post').then(res => {
            if (res.data.code == 0) {

            } else {
                
            }
        }).catch(error => {
            wx.showToast({
                title: "JSON.stringify(res.code + ':' + res.message)",
                duration: 2000
            })
        })
    },
    // 关注
    followFn: function (otherId, relation) {
        app.apiRequest('/social/relation/h/focus', { otherId, relation }, 'post').then(res => {
            if (res.data.code == 0) {

            } else {
                
            }
        }).catch(error => {
            wx.showToast({
                title: "JSON.stringify(res.code + ':' + res.message)",
                duration: 2000
            })
        })
    },
    // 点赞
    thumbFn: function (data) {
        app.apiRequest('/thumbup/thumb', data, 'post').then(res => {
            if (res.data.code == 0) {

            } else {
                
            }
        }).catch(error => {
            wx.showToast({
                title: "JSON.stringify(res.code + ':' + res.message)",
                duration: 2000
            })
        })
    },
    // 统计视频时长
    sendDeedFn( courseId, deed) {
        app.apiRequest('/course/cert/deed/view', { courseId, deed }, 'put').then(res => {
            if (res.data.code == 0) {

            } else {
                
            }
        })
    },
}

module.exports = {
    inter: inter
}