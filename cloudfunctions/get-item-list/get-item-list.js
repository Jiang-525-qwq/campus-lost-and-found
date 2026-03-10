// cloudfunctions/get-item-list/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { type, category, page = 1, pageSize = 10 } = event;
  const skip = (page - 1) * pageSize;

  // 构建查询条件
  let query = db.collection('items').where({
    status: 'approved' // 只显示已审核通过的
  });

  if (type) {
    query = query.where({ type: type });
  }
  if (category) {
    query = query.where({ category: category });
  }

  // 对应 SELECT * FROM items WHERE ... ORDER BY createTime DESC LIMIT ...
  const listRes = await query
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  // 获取总数，用于分页
  const countRes = await query.count();
  
  return {
    list: listRes.data,
    total: countRes.total
  };
};