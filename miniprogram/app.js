// app.js
App({
  globalData: {
    userInfo: null // 全局共享的用户信息
  },
  onLaunch() {
    // 1. 初始化云开发（必须，且env需替换为您的环境ID）
    wx.cloud.init({
      env: `cloud1-0g9a3c2u169424e4`,
      traceUser: true,
    });
    // 2. 尝试从本地缓存恢复登录态
    const userInfo = wx.getStorageSync(`userInfo`);
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  }
});