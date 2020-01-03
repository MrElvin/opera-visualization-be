const fs = require('fs')
const qs = require('qs')
const Opera = require('../models/opera')
const Lyric = require('../models/lyric')

const STEP_MAP = {
  100: 25,
  250: 75,
  500: 150
}

const getVariance = (array, average) =>
  array.map(v => Math.pow((v - average), 2)).reduce((prev, curr) => (prev += curr), 0) / array.length

async function getFingerData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const squareAmount = +queryParams.squareAmount || 250
  const step = STEP_MAP[squareAmount]
  const searchValue = queryParams.searchValue
  let result = null
  if (!searchValue) {
    result = JSON.parse(fs.readFileSync(`./allFingerData${squareAmount}.json`))
    ctx.body = result
  } else {
    const searchResults = await Opera.getOperaIdByName(searchValue)
    const promises = searchResults.map(opera => getFingerDataByOperaId(opera, squareAmount, step))
    result = await Promise.all(promises)
    // fs.writeFileSync(`./allFingerData${squareAmount}.json`, JSON.stringify({
    //   success: true,
    //   data: result
    // }))
    ctx.body = {
      success: true,
      data: result
    }
  }
}

async function getFingerDataByOperaId (opera, squareAmount, step) {
  const { operaId, operaName, operaTopic, operaPeriod } = opera
  const lyrics = (await Lyric.getLyricById(operaId)).map(lyric => lyric.lyricContent).join('')
  const splittedLyrics = generateLyricSlices(lyrics, squareAmount, step)
  const handledLyricsData = splittedLyrics.map((lyricSlice, index) => {
    if (index === 0) {
      return handleLyricSlices(lyricSlice, 'head')
    } else if (index === splittedLyrics.length - 1) {
      return handleLyricSlices(lyricSlice, 'tail')
    } else {
      return handleLyricSlices(lyricSlice, 'mid')
    }
  }).filter(v => v.sentenceAverageLength !== 0) // 去掉脏数据（句子平均长度为零）
  const result = {
    fingerData: handledLyricsData,
    lengthRange: handledLyricsData.map(v => v.sentenceAverageLength).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1),
    varianceRange: handledLyricsData.map(v => v.sentenceVariance).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1),
    operaId,
    operaName,
    operaTopic,
    operaPeriod
  }
  return result
}

function generateLyricSlices (lyrics, amount, step) {
  let index = 0
  const result = []
  while (index < lyrics.length) {
    result.push(lyrics.slice(index, index + amount))
    index = index + step
    if (index + amount > lyrics.length) break
  }
  result.push(lyrics.slice(-1 * amount, -1))
  return result
}

function handleLyricSlices (lyricSlice, position) {
  const sentenceEndReg = /[。？！……；]/g
  const lyricSplitted = lyricSlice.split(sentenceEndReg)
  // 避免从句子尾部裁切，导致在数组第一位和最后一位出现零星的词语
  const start = position === 'head' ? 0 : 1
  const end = position === 'tail' ? lyricSplitted.length : lyricSplitted.length - 1
  const lyricSplittedWithoutHeadAndTail = lyricSplitted.slice(start, end).filter(v => !!v)
  const result = {}
  result.sentenceContent = lyricSplittedWithoutHeadAndTail
  result.sentenceAverageLength = lyricSplittedWithoutHeadAndTail.reduce((prev, curr) => (prev += curr.length), 0) / lyricSplitted.length
  result.sentenceVariance = getVariance(lyricSplittedWithoutHeadAndTail.map(v => v.length), result.sentenceAverageLength)
  return result
}

async function getAllLyricLength (ctx) {
  const allOperaIds = (await Opera.getAllOperas()).map(v => v.operaId)
  const promises = allOperaIds.map(id => Lyric.getLyricById(id))
  const lyrics = (await Promise.all(promises))
  const lyricsByOperaId = lyrics.map(lyric => lyric.map(v => v.lyricContent).join(''))
  const lyricLengths = lyricsByOperaId.map(v => v.length)
  const sortedLyricLengths = lyricLengths.slice().sort((a, b) => a - b)
  const min = sortedLyricLengths[0]
  const max = sortedLyricLengths[sortedLyricLengths.length - 1]
  const average = sortedLyricLengths.reduce((prev, curr) => (prev += curr), 0) / sortedLyricLengths.length
  const distribution = {
    lt1000: 0,
    lt2500: 0,
    lt5000: 0,
    lt10000: 0,
    lt20000: 0,
    lt30000: 0,
    lt40000: 0
  }
  for (let i = 0; i < sortedLyricLengths.length; i++) {
    const item = sortedLyricLengths[i]
    if (item < 1000) {
      distribution.lt1000++
    } else if (item < 2500) {
      distribution.lt2500++
    } else if (item < 5000) {
      distribution.lt5000++
    } else if (item < 10000) {
      distribution.lt10000++
    } else if (item < 20000) {
      distribution.lt20000++
    } else if (item < 30000) {
      distribution.lt30000++
    } else {
      distribution.lt40000++
    }
  }
  ctx.body = {
    success: true,
    data: {
      min,
      max,
      average,
      distribution
    }
  }
}

module.exports = getFingerData
