// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前云环境
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('接收到登录请求，用户OPENID：', wxContext.OPENID) // 此条日志可在第一步中查看

  // 此处可添加将用户信息存入数据库的逻辑（可选）
  // const db = cloud.database()
  // ...

  // 必须返回以下核心信息给前端
  return {
    code: 0, // 成功状态码，必须与前端判断逻辑匹配
    message: 'success',
    data: {
      openid: wxContext.OPENID, // 用户的唯一标识，前端可能需要保存
      appid: wxContext.APPID,
      // 可以返回更多信息
    }
  }
}