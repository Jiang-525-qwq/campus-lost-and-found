// miniprogram/pages/publish/publish.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 表单数据对象
    formData: {
      type: 'lost', // 发布类型: 'lost'(寻物) 或 'found'(招领)
      title: '',
      description: '',
      location: '',
      date: '', // 丢失/拾取日期
      images: [], // 图片的临时文件路径数组
    },
    // 地点选择器的选项（与首页保持一致）
    locationOptions: ['图书馆', '教学楼', '食堂', '宿舍区', '操场', '校门', '其他'],
    locationIndex: 0, // 当前选中的地点索引
    // 控制UI状态
    isSubmitting: false, // 防止重复提交
    wordCount: 0, // 描述字数统计
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置默认日期为今天
    const today = this.getTodayDate();
    this.setData({
      'formData.date': today,
    });
  },

  // 获取今日日期字符串 (YYYY-MM-DD)
  getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 1. 选择发布类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type,
    });
  },

  // 2. 处理输入框/文本域变化
  onInput(e) {
    const field = e.currentTarget.dataset.field || e.currentTarget.id;
    const value = e.detail.value;

    this.setData({
      [`formData.${field}`]: value,
    });

    // 如果是描述字段，更新字数统计
    if (field === 'description') {
      this.setData({
        wordCount: value.length,
      });
    }
  },

  // 3. 选择地点
  onLocationChange(e) {
    const index = e.detail.value;
    const location = this.data.locationOptions[index];
    this.setData({
      locationIndex: index,
      'formData.location': location,
    });
  },

  // 4. 选择日期
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value,
    });
  },

  // 5. 选择图片
  chooseImage() {
    const currentImages = this.data.formData.images;
    const maxCount = 3;
    const remainCount = maxCount - currentImages.length;

    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none',
      });
      return;
    }

    wx.chooseMedia({
      count: remainCount, // 最多可以选 remainCount 张
      mediaType: ['image'], // 只允许选择图片
      sourceType: ['album', 'camera'], // 从相册或相机选择
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          'formData.images': [...currentImages, ...newImages],
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none',
        });
      },
    });
  },

  // 6. 删除已选的图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.formData.images;
    images.splice(index, 1); // 删除指定索引的图片
    this.setData({
      'formData.images': images,
    });
  },

  // 7. 表单验证
  validateForm() {
    const { title, description, location } = this.data.formData;
    if (!title.trim()) {
      wx.showToast({ title: '请填写物品名称', icon: 'none' });
      return false;
    }
    if (!description.trim()) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' });
      return false;
    }
    if (!location) {
      wx.showToast({ title: '请选择地点', icon: 'none' });
      return false;
    }
    return true;
  },

  // 8. 提交表单
  async onSubmit(e) {
    // 防止重复提交
    if (this.data.isSubmitting) return;
    
    // 表单验证
    if (!this.validateForm()) return;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...', mask: true });

    try {
      // 8.1 如果有图片，先上传图片到云存储，获取 fileID
      let imageUrls = [];
      if (this.data.formData.images.length > 0) {
        imageUrls = await this.uploadImages();
      }

      // 8.2 准备提交到云数据库的数据
      const submitData = {
        ...this.data.formData,
        images: imageUrls, // 替换为云存储的 fileID
        createTime: new Date(), // 服务端时间更准确，这里先占位
        status: 'pending', // 状态: pending(待认领)/claimed(已认领)/returned(已归还)
        // 注意：发布者信息（openid）应在云函数中从上下文获取，更安全
      };

      // 8.3 调用云函数进行发布
      const result = await this.callCloudFunction('publishItem', submitData);

      wx.hideLoading();
      this.setData({ isSubmitting: false });

      // 8.4 处理结果
      if (result.code === 0) {
        wx.showToast({
          title: '发布成功！',
          icon: 'success',
          duration: 1500,
          success: () => {
            // 跳转回首页，并刷新数据
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index',
              });
            }, 1500);
          },
        });
      } else {
        wx.showToast({
          title: `发布失败: ${result.message || '未知错误'}`,
          icon: 'none',
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('发布过程出错:', error);
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({
        title: '网络或服务器异常，请重试',
        icon: 'none',
        duration: 3000,
      });
    }
  },

  // 上传图片到云存储
  uploadImages() {
    const uploadTasks = this.data.formData.images.map((filePath) => {
      // 生成云存储路径，可按日期分类
      const cloudPath = `publish_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      return wx.cloud.uploadFile({
        cloudPath,
        filePath,
      }).then(res => res.fileID) // 上传成功，返回文件的唯一 fileID
        .catch(err => {
          console.error('单个图片上传失败:', err);
          throw err;
        });
    });

    return Promise.all(uploadTasks);
  },

  // 调用云函数 (通用方法)
  callCloudFunction(name, data) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name, // 云函数名称，如 'publishItem'
        data,
        success: (res) => {
          console.log(`云函数 ${name} 调用成功:`, res);
          resolve(res.result || { code: 0, message: 'success' });
        },
        fail: (err) => {
          console.error(`云函数 ${name} 调用失败:`, err);
          reject(err);
        },
      });
    });
  },

  // 重置表单
  resetForm() {
    this.setData({
      formData: {
        type: 'lost',
        title: '',
        description: '',
        location: '',
        date: this.getTodayDate(),
        images: [],
      },
      locationIndex: 0,
      wordCount: 0,
    });
  },
});