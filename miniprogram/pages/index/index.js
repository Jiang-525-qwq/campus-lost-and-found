Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    activeTab: 'all', // all/lost/found
    sortIndex: 0,
    sortOptions: ['最新发布', '丢失时间最近', '拾取时间最近'],
    locationIndex: 0,
    locationOptions: ['全部地点', '图书馆', '教学楼', '食堂', '宿舍区', '操场'],
    
    // 帖子数据
    postList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    
    // 模拟数据（开发阶段用）
    mockData: [
      {
        id: 1,
        type: 'lost',
        title: '寻找丢失的校园卡',
        description: '姓名：张三，学号：20231001，3月5日在图书馆丢失',
        location: '图书馆',
        images: [],
        status: 'pending',
        createTime: '2026-03-05 14:30:00',
        lostTime: '2026-03-05 13:00:00'
      },
      {
        id: 2,
        type: 'found',
        title: '捡到一个黑色钱包',
        description: '内有身份证、银行卡若干，失主请速联系',
        location: '二食堂',
        images: [],
        status: 'pending',
        createTime: '2026-03-04 10:20:00',
        foundTime: '2026-03-04 09:30:00'
      }
    ]
  },

  onLoad() {
    this.loadPosts();
  },

  // 加载帖子列表
  loadPosts() {
    if (this.data.isLoading || !this.data.hasMore) return;
    
    this.setData({ isLoading: true });
    
    // 模拟网络请求
    setTimeout(() => {
      // 这里应该调用云函数获取真实数据
      // 暂时使用模拟数据
      const newPosts = this.data.mockData;
      
      this.setData({
        postList: [...this.data.postList, ...newPosts],
        page: this.data.page + 1,
        isLoading: false,
        hasMore: newPosts.length >= this.data.pageSize
      });
    }, 500);
  },

  // 搜索相关函数
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    // 重置分页，重新加载
    this.setData({
      postList: [],
      page: 1,
      hasMore: true
    });
    this.loadPosts();
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      postList: [],
      page: 1,
      hasMore: true
    });
    this.loadPosts();
  },

  // 排序和筛选
  onSortChange(e) {
    this.setData({
      sortIndex: e.detail.value,
      postList: [],
      page: 1,
      hasMore: true
    });
    this.loadPosts();
  },

  onLocationFilter(e) {
    this.setData({
      locationIndex: e.detail.value,
      postList: [],
      page: 1,
      hasMore: true
    });
    this.loadPosts();
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadPosts();
  },

  // 格式化时间显示
  formatTime(timeStr) {
    const time = new Date(timeStr);
    const now = new Date();
    const diff = now - time;
    
    if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return time.getMonth() + 1 + '月' + time.getDate() + '日';
    }
  }
});