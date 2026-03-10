// miniprogram/pages/detail/detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面状态
    postId: '', // 从URL参数获取
    isLoading: true,
    loadError: false,
    isMyPost: false, // 是否是当前用户发布的
    
    // 帖子数据
    postData: {
      id: '',
      type: 'lost', // 'lost' 或 'found'
      title: '',
      description: '',
      location: '',
      images: [],
      status: 'pending', // 'pending', 'claimed', 'returned'
      createTime: '',
      lostTime: '',
      foundTime: '',
      publisherId: '',
      contactInfo: ''
    },
    
    // 图片URL（处理过的）
    imageUrls: [],
    
    // 发布者信息
    publisherInfo: {
      nickName: '',
      avatarUrl: ''
    },
    
    // 相似推荐
    similarPosts: [],
    
    // 当前用户信息
    currentUser: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options && options.id) {
      this.setData({ postId: options.id });
      this.loadPostDetail(options.id);
    } else {
      this.setData({ loadError: true, isLoading: false });
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
    
    // 获取当前用户信息
    const app = getApp();
    if (app.globalData.userInfo) {
      this.setData({ currentUser: app.globalData.userInfo });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (this.data.postId) {
      this.loadPostDetail(this.data.postId, false);
    }
  },

  // 加载帖子详情
  loadPostDetail(id, showLoading = true) {
    if (showLoading) {
      this.setData({ isLoading: true, loadError: false });
    }
    
    // 调用云函数获取详情
    wx.cloud.callFunction({
      name: 'getPostDetail',
      data: { postId: id },
      success: (res) => {
        if (res.result.code === 0) {
          const postData = res.result.data;
          const isMyPost = this.data.currentUser && 
                          this.data.currentUser._openid === postData.publisherId;
          
          this.setData({
            postData: postData,
            imageUrls: postData.images || [],
            publisherInfo: postData.publisherInfo || {},
            isMyPost: isMyPost,
            isLoading: false
          });
          
          // 加载相似推荐
          this.loadSimilarPosts(postData);
        } else {
          this.handleLoadError();
        }
      },
      fail: (err) => {
        console.error('加载详情失败:', err);
        this.handleLoadError();
        
        // 开发阶段：使用模拟数据
        this.useMockData(id);
      }
    });
  },

  // 使用模拟数据（开发阶段）
  useMockData(id) {
    const mockData = {
      id: id,
      type: Math.random() > 0.5 ? 'lost' : 'found',
      title: '测试物品标题',
      description: '这是一个详细的物品描述，用于开发和测试。包含物品的特征、丢失/捡到的时间地点等信息。',
      location: '图书馆三楼',
      images: [],
      status: 'pending',
      createTime: '2026-03-10 14:30:00',
      lostTime: '2026-03-10 13:00:00',
      publisherId: 'test_user_123',
      contactInfo: '微信联系'
    };
    
    const mockPublisher = {
      nickName: '测试用户',
      avatarUrl: '/images/default-avatar.png'
    };
    
    this.setData({
      postData: mockData,
      publisherInfo: mockPublisher,
      isMyPost: false,
      isLoading: false
    });
  },

  // 处理加载错误
  handleLoadError() {
    this.setData({
      loadError: true,
      isLoading: false
    });
  },

  // 重新加载
  retryLoad() {
    this.loadPostDetail(this.data.postId);
  },

  // 加载相似帖子
  loadSimilarPosts(currentPost) {
    // 根据标题关键词或分类查找相似
    wx.cloud.callFunction({
      name: 'getSimilarPosts',
      data: {
        keywords: currentPost.title,
        type: currentPost.type,
        excludeId: currentPost.id
      },
      success: (res) => {
        if (res.result.code === 0 && res.result.data.length > 0) {
          this.setData({ similarPosts: res.result.data.slice(0, 5) });
        }
      }
    });
  },

  // 格式化时间显示
  formatTime(timeStr, full = false) {
    if (!timeStr) return '未知时间';
    
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now - time;
    
    if (full) {
      return `${time.getMonth() + 1}月${time.getDate()}日 ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) { // 7天内
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      return `${time.getMonth() + 1}月${time.getDate()}日`;
    }
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.imageUrls.length > 0) {
      wx.previewImage({
        current: this.data.imageUrls[index],
        urls: this.data.imageUrls
      });
    }
  },

  // 查看用户主页
  viewUserProfile(e) {
    const userId = e.currentTarget.dataset.userid;
    if (userId) {
      // 可以跳转到用户主页
      // wx.navigateTo({
      //   url: `/pages/user/profile?userId=${userId}`
      // });
    }
  },

  // 开始私聊
  startChat() {
    if (!this.data.currentUser) {
      // 引导登录
      wx.showModal({
        title: '提示',
        content: '需要登录后才能联系发布者',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/me/me'
            });
          }
        }
      });
      return;
    }
    
    // 跳转到私聊页面
    wx.navigateTo({
      url: `/pages/chat/chat?targetUserId=${this.data.postData.publisherId}&postId=${this.data.postId}`
    });
  },

  // 更新状态（如标记为已找到/已归还）
  updateStatus(e) {
    const newStatus = e.currentTarget.dataset.status;
    wx.showModal({
      title: '确认',
      content: newStatus === 'claimed' ? 
        (this.data.postData.type === 'lost' ? '确定标记为"已找到"吗？' : '确定标记为"已归还"吗？') : 
        '确定更新状态吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'updatePostStatus',
            data: {
              postId: this.data.postId,
              status: newStatus
            },
            success: (res) => {
              if (res.result.code === 0) {
                this.setData({
                  'postData.status': newStatus
                });
                wx.showToast({
                  title: '更新成功',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  },

  // 编辑帖子
  editPost() {
    wx.navigateTo({
      url: `/pages/publish/publish?editId=${this.data.postId}`
    });
  },

  // 删除帖子
  deletePost() {
    wx.showModal({
      title: '警告',
      content: '确定要删除这个帖子吗？删除后不可恢复。',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'deletePost',
            data: { postId: this.data.postId },
            success: (res) => {
              if (res.result.code === 0) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success',
                  duration: 1500,
                  success: () => {
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  }
                });
              }
            }
          });
        }
      }
    });
  },

  // 查看相似物品详情
  viewSimilarDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.redirectTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `${this.data.postData.type === 'lost' ? '寻物' : '招领'}：${this.data.postData.title}`,
      path: `/pages/detail/detail?id=${this.data.postId}`,
      imageUrl: this.data.imageUrls[0] || '/images/share-default.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `${this.data.postData.type === 'lost' ? '寻物启事' : '失物招领'} - ${this.data.postData.title}`,
      query: `id=${this.data.postId}`,
      imageUrl: this.data.imageUrls[0] || '/images/share-default.png'
    };
  }
});