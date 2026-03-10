// miniprogram/pages/me/me.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {},
    isLoggedIn: false,
    
    // 数据统计
    stats: {
      total: 0,
      pending: 0,
      finished: 0
    },
    
    // 未读消息数
    unreadCount: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时刷新数据
    if (this.data.isLoggedIn) {
      this.loadUserStats();
      this.checkUnreadMessages();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
      this.setData({
        userInfo: app.globalData.userInfo,
        isLoggedIn: true
      });
      this.loadUserStats();
    } else {
      // 尝试从本地存储获取
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.nickName) {
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
        app.globalData.userInfo = userInfo;
        this.loadUserStats();
      } else {
        this.setData({ isLoggedIn: false });
      }
    }
  },

  // 加载用户数据统计
  loadUserStats() {
    if (!this.data.isLoggedIn) return;
    
    // 调用云函数获取用户发布统计
    wx.cloud.callFunction({
      name: 'getUserStats',
      data: {
        userId: this.data.userInfo._openid
      },
      success: (res) => {
        if (res.result && res.result.code === 0) {
          this.setData({
            stats: res.result.data
          });
        } else {
          this.useMockStats(); // 使用模拟数据
        }
      },
      fail: (err) => {
        console.error('获取用户统计失败:', err);
        this.useMockStats(); // 使用模拟数据
      }
    });
  },

  // 使用模拟统计数据
  useMockStats() {
    this.setData({
      stats: {
        total: 3,
        pending: 1,
        finished: 2
      }
    });
  },

  // 检查未读消息
  checkUnreadMessages() {
    wx.cloud.callFunction({
      name: 'getUnreadCount',
      data: {
        userId: this.data.userInfo._openid
      },
      success: (res) => {
        if (res.result && res.result.code === 0) {
          this.setData({
            unreadCount: res.result.count || 0
          });
        }
      },
      fail: (err) => {
        console.error('获取未读消息失败:', err);
        this.setData({ unreadCount: 0 });
      }
    });
  },

  // 微信登录授权
  onGotUserInfo(e) {
    if (e.detail.errMsg === 'getUserInfo:ok') {
      // 用户点击了允许授权
      const userInfo = e.detail.userInfo;
      wx.showLoading({ title: '登录中...' });
      
      // 调用云函数进行登录
      wx.cloud.callFunction({
        name: 'login',
        data: { userInfo: userInfo },
        success: (res) => {
          wx.hideLoading();
          if (res.result && res.result.code === 0) {
            const fullUserInfo = {
              ...userInfo,
              _openid: res.result.openid || res.result._openid
            };
            
            // 保存到全局和本地
            getApp().globalData.userInfo = fullUserInfo;
            wx.setStorageSync('userInfo', fullUserInfo);
            
            this.setData({
              userInfo: fullUserInfo,
              isLoggedIn: true
            });
            
            // 加载统计数据
            this.loadUserStats();
            
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1500
            });
          } else {
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('登录失败:', err);
          wx.showToast({
            title: '网络异常，请重试',
            icon: 'none'
          });
        }
      });
    } else {
      // 用户点击了拒绝授权
      wx.showToast({
        title: '您拒绝了授权',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 点击用户信息区域
  onTapUserInfo() {
    if (!this.data.isLoggedIn) {
      return;
    }
    // 可以跳转到编辑资料页面（后续扩展）
    // wx.navigateTo({
    //   url: '/pages/me/edit-profile/edit-profile'
    // });
  },

  // 导航到我的发布页面
  navigateToMyPosts(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/me/my-posts/my-posts?filter=${type}`
    });
  },

  // 关于平台
  onAbout() {
    wx.showModal({
      title: '关于校园寻物',
      content: '一个帮助校园师生找回失物、发布招领信息的互助平台。\n\n版本: 1.0.0\n开发团队: 校园寻物项目组',
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#07C160'
    });
  },

  // 意见反馈
  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 用户协议
  onUserProtocol() {
    wx.showModal({
      title: '用户协议',
      content: '请访问小程序设置页查看完整的《用户协议》',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 隐私政策
  onPrivacyProtocol() {
    wx.showModal({
      title: '隐私政策',
      content: '请访问小程序设置页查看完整的《隐私政策》',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#07C160',
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('userInfo');
          getApp().globalData.userInfo = null;
          
          this.setData({
            userInfo: {},
            isLoggedIn: false,
            stats: { total: 0, pending: 0, finished: 0 },
            unreadCount: 0
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '校园寻物 - 失物招领互助平台',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '校园寻物 - 帮助你我，温暖校园',
      query: '',
      imageUrl: '/images/share-cover.png'
    };
  }
});