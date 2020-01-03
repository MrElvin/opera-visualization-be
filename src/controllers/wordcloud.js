const qs = require('qs')
const nodejieba = require('nodejieba')
const Opera = require('../models/opera')
const Lyric = require('../models/lyric')

async function getWordcloudData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const dataKeyMap = {
    topic: 'operaTopic',
    book: 'operaBook',
    period: 'operaPeriod'
  }
  let operaIdResult = null
  // 前端点击了 link
  if (Array.isArray(queryParams.filterKey)) {
    // 找到符合条件的 operaId，根据 id 找到相应的剧本台词
    operaIdResult = (await Opera.getOperaIdByType({
      [dataKeyMap[queryParams.filterKey[0]]]: queryParams.filterValue[0],
      [dataKeyMap[queryParams.filterKey[1]]]: queryParams.filterValue[1]
    })).map(v => v.operaId)
  } else {
  // 前端点击了 node
    operaIdResult = (await Opera.getOperaIdByType({
      [dataKeyMap[queryParams.filterKey]]: queryParams.filterValue
    })).map(v => v.operaId)
  }
  const promises = operaIdResult.map(id => Lyric.getLyricById(id))
  const lyrics = (await Promise.all(promises)).reduce((prev, curr) => [...prev, ...curr], [])
  const sentences = lyrics.map(v => v.lyricContent).join('\n')
  const topN = 100
  const result = nodejieba.extract(sentences, topN)
  ctx.body = {
    success: true,
    data: result
  }
}

module.exports = getWordcloudData
