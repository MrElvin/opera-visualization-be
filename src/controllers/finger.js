const fs = require('fs')
const qs = require('qs')
const Opera = require('../models/opera')
const Lyric = require('../models/lyric')

const judgeTest = require('./judgeTest')

const STEP_MAP = {
  100: 25,
  // 300: 75,
  400: 100,
  800: 200
}

const getProperSquareCount = lyricLength => {
  if (lyricLength < 2500) {
    return 100
  } else if (lyricLength < 5000) {
    return 400
  } else {
    return 800
  }
}

const getMedian = arr => {
  const sort = arr.sort((a, b) => a - b)
  if (sort.length % 2) {
    return sort[(sort.length - 1) / 2]
  } else {
    const right = sort[sort.length / 2]
    const left = sort[(sort.length / 2) - 1]
    return Math.floor((right + left) / 2)
  }
}

const getAverage = arr => {
  const total = arr.reduce((prev, curr) => {
    prev += curr
    return prev
  }, 0)
  return total / arr.length
}

const getTopFourth = arr => {
  const sort = arr.sort((a, b) => a - b)
  return sort[Math.floor(sort.length / 4) * 3]
}

const getVariance = (array, average) =>
  array.map(v => Math.pow((v - average), 2)).reduce((prev, curr) => (prev += curr), 0) / array.length

async function getFingerData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const squareAmount = +queryParams.squareAmount || 250
  const step = STEP_MAP[squareAmount]
  const searchValue = queryParams.searchValue
  let result = null
  // 如要开始正确率测试，则将下面的 if 部分注释掉
  if (!searchValue) {
    result = JSON.parse(fs.readFileSync(`./allFingerData${squareAmount}.json`))
    ctx.body = result
  } else {
  // 如要开始正确率测试，则将下面一行的注释取消掉
  // const searchResults = (await Opera.getOperaIdByName(searchValue)).slice(0, 300)
    const searchResults = (await Opera.getOperaIdByName(searchValue))
    const promises = searchResults.map(opera => getFingerDataByOperaId(opera, squareAmount, step))
    result = await Promise.all(promises)
    /** ********** 正确率测试开始 ************/
    // const resulted = { short: 0, mid: 0, long: 0 }
    // for (let i = 0; i < result.length; i++) {
    //   const id = result[i].operaId
    //   for (let j = 0; j < judgeTest.length; j++) {
    //     if (id === judgeTest[j].id) {
    //       if (result[i].isSingOpera.result === judgeTest[j].resultExpect) resulted[judgeTest[j].type]++
    //       else console.log(id)
    //     }
    //   }
    // }
    // console.log(resulted)
    /** ********** 正确率测试结束 ************/
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

async function judgeIsSingOpera (lyrics, lyricLength) {
  // 获取合适的像素尺度和步进长度
  const squareAmount = getProperSquareCount(lyricLength)
  const step = STEP_MAP[squareAmount]
  // 分片处理
  const splittedLyrics = generateLyricSlices(lyrics, squareAmount, step)
  // 生成每片的句子列表
  const handledLyricsData = splittedLyrics.map((lyricSlice, index) => {
    if (index === 0) {
      return handleLyricSlices(lyricSlice, 'head')
    } else if (index === splittedLyrics.length - 1) {
      return handleLyricSlices(lyricSlice, 'tail')
    } else {
      return handleLyricSlices(lyricSlice, 'mid')
    }
  }).filter(v => v.sentenceAverageLength !== 0)
  const data = {
    // 所有片段的句子列表总集合
    fingerData: handledLyricsData,
    // 所有长度的最小值和最大值
    lengthRange: handledLyricsData.map(v => v.sentenceAverageLength).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1),
    // 所有方差的最小值和最大值
    varianceRange: handledLyricsData.map(v => v.sentenceVariance).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1)
  }
  const result = judgeSingOpera(data)
  return result
}

function judgeSingOpera (data) {
  // 长度突变，差的均值，如果小于均值，则归在一个大色块里面，如这里面没有方差突变，则全部算入 count
  let averageLengthDiffTotal = 0
  // 获取每个像素的平均长度列表
  const lengthArray = data.fingerData.map(v => v.sentenceAverageLength)
  // 获取差值之和
  for (let i = 0; i < lengthArray.length - 1; i++) {
    averageLengthDiffTotal += Math.abs(lengthArray[i] - lengthArray[i + 1])
  }
  // 获取长度突变阈值
  const averageLengthDiff = averageLengthDiffTotal / (lengthArray.length - 1)

  // 获取所有像素方差的列表
  const varianceArray = data.fingerData.map(v => v.sentenceVariance)
  let varianceDiffTotal = 0
  // 获取方差间的差值
  for (let i = 0; i < varianceArray.length - 1; i++) {
    varianceDiffTotal += Math.abs(varianceArray[i] - varianceArray[i + 1])
  }
  // 获取方差突变的上下阈值
  const varianceDiffMax = varianceDiffTotal / (varianceArray.length - 1)
  // 长文取中位数，短文取上四分位数
  // const varianceDiffMin = data.lyricLength > 2500 ? getAverage(varianceArray) : getMedian(varianceArray)
  const varianceDiffMin = getAverage(varianceArray)
  // const map = {}
  // for (let i = 0; i < varianceArray.length; i++) {
  //   const item = parseInt(varianceArray[i] / 10) + ''
  //   if (map[item]) {
  //     map[item] = map[item] + 1
  //   } else {
  //     map[item] = 1
  //   }
  // }
  // const mapArray = Object.keys(map)
  //   .map(k => ({ key: k, value: map[k] }))
  //   .sort((a, b) => a.value - b.value)
  // const varianceDiffMin = +mapArray[mapArray.length - 1].key * 10 + 10

  const totalCount = data.fingerData.length
  let singCount = 0
  let temp = []
  for (let i = 0; i < data.fingerData.length; i++) {
    // 如果不是最后一个像素
    if (i !== data.fingerData.length - 1) {
      const item = data.fingerData[i]
      // 如果后一个像素与当前像素的长度差超过长度阈值
      if (
        Math.abs(
          data.fingerData[i + 1].sentenceAverageLength -
            item.sentenceAverageLength
        ) > averageLengthDiff
      ) {
        temp.push(item)
        // 如果临时区域是空，则不管
        if (temp.length < 1) {
          temp = []
        } else if (temp.length > 1) {
          for (let j = 0; j < temp.length; j++) {
            // 如果当前元素不是最后的，那么如果它的方差小于方差均值，且与后面的像素方差相差小于大阈值，则唱段数加加
            if (
              j !== temp.length - 1 &&
              temp[j].sentenceVariance < varianceDiffMin &&
              Math.abs(
                temp[j].sentenceVariance - temp[j + 1].sentenceVariance
              ) < varianceDiffMax
            ) {
              singCount++
            }
            // 如果当前元素是最后的，那么如果它的方差小于方差均值，则唱段数加加
            // else if (j === temp.length - 1 &&
            //   temp[j].sentenceVariance < varianceDiffMin) {
            //   singCount++
            // }
          }
          temp = []
        } else {
          // 如果临时区域有一个元素，并且该元素方差小于平均方差，则唱段加加，清空临时区域
          if (temp[0].sentenceVariance < varianceDiffMin) singCount++
          temp = []
        }
      } else {
        // 如果后一个像素与当前像素的长度差没有超过长度阈值，则推入临时区域
        temp.push(item)
      }
    } else {
      if (temp.length > 1) {
        for (let j = 0; j < temp.length; j++) {
          // 如果当前元素不是最后的，那么如果它的方差小于方差均值，且与后面的像素方差相差小于大阈值，则唱段数加加
          if (
            j !== temp.length - 1 &&
            temp[j].sentenceVariance < varianceDiffMin &&
            Math.abs(
              temp[j].sentenceVariance - temp[j + 1].sentenceVariance
            ) < varianceDiffMax
          ) {
            singCount++
          }
          // 如果当前元素是最后的，那么如果它的方差小于方差均值，则唱段数加加
          // else if (j === temp.length - 1 && temp[j].sentenceVariance < varianceDiffMin) {
          //   singCount++
          // }
        }
      } else if (temp.length === 1) {
        // 如果当前元素是最后的，那么如果它的方差小于方差均值，则唱段数加加
        if (temp[0].sentenceVariance < varianceDiffMin) singCount++
      }
      temp = []
    }
  }
  return {
    result: singCount >= Math.floor(totalCount / 2),
    singCount,
    value: Math.floor(totalCount / 2)
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
  const lyricLength = lyrics.length
  const isSingOpera = await judgeIsSingOpera(lyrics, lyricLength)
  const result = {
    fingerData: handledLyricsData,
    lengthRange: handledLyricsData.map(v => v.sentenceAverageLength).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1),
    varianceRange: handledLyricsData.map(v => v.sentenceVariance).sort((a, b) => a - b).filter((_, index) => index === 0 || index === handledLyricsData.length - 1),
    operaId,
    operaName,
    operaTopic,
    operaPeriod,
    lyricLength,
    isSingOpera
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

async function getLyricLength (operaId) {
  const lyric = (await Lyric.getLyricById(operaId)).join('')
  return lyric.length
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
