const qs = require('qs')
const Opera = require('../models/opera')

async function getDrawerData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const { operaId } = queryParams
  const operaIds = operaId.split(',')
  const promises = operaIds.map(id => Opera.getOperaNameById(id))
  const result = await Promise.all(promises)
  ctx.body = {
    success: true,
    data: result.map(v => ({
      name: v[0].operaName,
      id: v[0].operaId
    }))
  }
}

module.exports = getDrawerData
