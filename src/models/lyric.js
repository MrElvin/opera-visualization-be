// const Sequelize = require('sequelize')

const OperaDB = require('../db')

const lyricModel = '../schema/lyric'
const Lyric = OperaDB.import(lyricModel)

/**
 * 根据剧本 id，获取剧本台词
 *
 * @returns
 */
const getLyricById = async function (operaId) {
  const lyric = await Lyric.findAll({
    where: {
      operaId
    }
  })
  return lyric
}

const getAllLyricSpeakType = async function () {
  const speakType = await Lyric.findAll({
    where: {},
    attributes: [[OperaDB.fn('DISTINCT', OperaDB.col('speakType')), 'speakTypeDistinct']]
  })
  return speakType
}

module.exports = {
  getLyricById,
  getAllLyricSpeakType
}
