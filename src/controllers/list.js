const Opera = require('../models/opera')

const list = async ctx => {
  const page = +ctx.request.URL.searchParams.get('page') || 1
  const limit = +ctx.request.URL.searchParams.get('limit') || 20
  let data = null
  try {
    data = await Opera.getOperaList(page, limit)
    const allOperas = await Opera.getAllOperas()
    ctx.body = {
      success: true,
      data: {
        operas: data,
        totalCount: allOperas.length
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      data: null
    }
  }
}

module.exports = list
