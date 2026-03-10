// cloudfunctions/get-item-detail/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { itemId } = event;

  // 1. 查询物品详情
  const itemRes = await db.collection('items').doc(itemId).get();
  if (!itemRes.data) {
    return { code: 404, message: '物品不存在' };
  }

  // 2. 关联查询发布者信息（对应多表关联查询）
  const userRes = await db.collection('users').where({
    _openid: itemRes.data._openid
  }).get();

  return {
    item: itemRes.data,
    publisher: userRes.data[0] || null // 返回发布者信息
  };
};