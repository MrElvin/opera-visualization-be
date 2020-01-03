const qs = require('qs')
const Opera = require('../models/opera')
const Role = require('../models/role')
const Lyric = require('../models/lyric')

async function getFlowDataById (ctx) {
  const queryParams = qs.parse(ctx.query)
  const operaId = queryParams.operaId
  const lyrics = await Lyric.getLyricById(operaId)
  ctx.body = {
    success: true,
    data: lyrics
  }
}

async function getAllSpeakType (ctx) {
  const result = (await Lyric.getAllLyricSpeakType()).map(v => v.dataValues.speakTypeDistinct)
  ctx.body = {
    success: true,
    data: result
  }
}

module.exports = getAllSpeakType
