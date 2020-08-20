const app = getApp();
import regeneratorRuntime from '../../../utils/runtime'

Page({
    data: {
        headerHeight: 0,
        courseListTitieActiveIndex: 0,
        courseListPznLeft: 0
    },

    onLoad: function (options) {
        this.getElementHeight();
    },

    async getElementHeight() {
        let h = await app.getElementHeight('.page-header');
        this.setData({
            headerHeight: h
        });
    },

    switchCourseList(e) {
        this.setData({
            courseListTitieActiveIndex: e.currentTarget.dataset.index,
            courseListPznLeft: e.currentTarget.dataset.left
        });
    }
})