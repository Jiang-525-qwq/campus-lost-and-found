// cloudfunctions/update-item-status/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const { itemId, newStatus } = event;

  // 先检查当前用户是否有权限（例如是发布者或管理员）
  const itemRes = await db.collection('items').doc(itemId).get();
  if (itemRes.data._openid !== wxContext.OPENID) {
    // 这里可以添加管理员权限检查
    return { code: 403, message: '无权限操作' };
  }

  // 对应 UPDATE items SET status = ?, updateTime = NOW() WHERE _id = ?
  return await db.collection('items').doc(itemId).update({
    data: {
      status: newStatus,
      updateTime: new Date()
    }
  });
};