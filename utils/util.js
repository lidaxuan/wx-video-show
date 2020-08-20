const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}


///当前时间,结束时间,需要倒计时阈值(毫秒级,默认为72*3600*1000)
function needBindingTimer(nowtime, etime, threshold) {
    var defaultThreshold = threshold > 0 ? threshold : 72 * 3600 * 1000
    var diffrent = Math.max(etime - nowtime, 0)
    ///剩余秒
    var remainingTime = diffrent
    var bingData = {}
    bingData.show = remainingTime <= defaultThreshold && remainingTime > 0
    bingData.time = remainingTime
    return bingData
}

 function countTimes(beginTimeData, endTimeData) {
    let intervalData = 72 * 60 * 60 * 1000;
    let currentData = parseInt(Date.parse(new Date())); //当前时间戳
     if (beginTimeData - currentData > 0) { //优惠券未激活
        return 1;
     } else if (endTimeData - currentData <= intervalData && endTimeData - currentData > 0) { //结束时间到72小时
        return 2;
    } else {
        return 3;
    }
}



module.exports = {
    formatTime: formatTime,
    needBindingTimer: needBindingTimer,
    countTimes
}