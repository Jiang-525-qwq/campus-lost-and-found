// cloudfunctions/publish-item/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const { type, title, category, description, location, images, contactInfo } = event;

  // 对应 INSERT INTO items (...) VALUES (...)
  return await db.collection('items').add({
    data: {
      _openid: wxContext.OPENID,
      type: type,
      title: title,
      category: category,
      description: description,
      location: location,
      images: images, // 假设前端已上传图片至云存储并返回fileID
      status: 'pending', // 初始状态为待审核
      contactInfo: contactInfo,
      createTime: new Date(),
      updateTime: new Date()
    }
  });
};