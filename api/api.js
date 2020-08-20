const base = 'https://test2.xiujianshen.com';

export default {
    // 微信登录
    wxLogin: '/auth/wx/applet/login',
    // 秀健身账号登录
    xjsLogin: '/auth/login',
    // 绑定手机号码
    bindingPhone: '/auth/bindingPhone',
    // 解密
    encrypteddata: '/auth/wx/applet/encrypteddata/get',
    // 问卷列表
    askrollList: '/user/askroll/list',
    // 保存问卷
    askrollSave: '/user/askroll/save',
    // 问卷详情
    askrollDetails: '/user/askroll/details',
    // 小程序绑定手机号
    appletBindingPhone: '/auth/appletBindingPhone',
    // 检查是否完成问卷
    checkFirstEnter: '/user/askroll/checkFirstEnter',
    // 获取短信验证码
    getSms: '/auth/getWxAppletSms',
    // 获取用户基本信息
    profileByUserId: '/user/profileByUserId',
    // 邀请的好友数量
    getInvitedCount: '/user/getInvitedCount',
    // 我邀请的好友列表
    getFriends: '/user/getFriends',
    // 获取当前用户邀请的商家列表
    getInvitedMers: '/user/getInvitedMers',
    // 获取收藏列表
    myCollectList: '/course/opt/myCollectList',
    // 获取点赞列表
    myThumbList: '/course/opt/myThumbList',
    // 获取关注列表
    focuses: '/social/relation/focuses',
    // 搜索-公开课、精选课列表
    courseCl: '/search/foreign/course/cl',
    // 搜索
    search: '/search/foreign/course',
    //获取微信小程序课程列表
    courseList: '/course/visitor/wx/list',
    // 查询是否关注某人
    relation: '/social/relation/relation',
    // 关注/取消关注
    focus: '/social/relation/h/focus',
    // 取消绑定手机号
    wxUnbundlingThird: '/user/wxUnbundlingThird',
    //返券列表
    returnCouponList: '/coupon/returnCouponList',
    // 获取当前用户邀请的商家和直属下级数量
    invitedCount: '/user/getInvitedCount',
    //小程序佣金明细列表
    brokerageList: '/bean/w/brokerage/detail',
    //佣金总金额（余额）
    totalMoney: '/bean/brokerage/index'
}