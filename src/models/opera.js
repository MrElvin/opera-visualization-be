const Sequelize = require('sequelize')
const OperaDB = require('../db')

const Op = Sequelize.Op
const operaModel = '../schema/opera'
const Opera = OperaDB.import(operaModel)

/**
 * 获取分页的剧本列表
 *
 * @param {*} offset
 * @param {number} [limit=20]
 * @returns
 */
const getOperaList = async function (page, limit) {
  const operas = await Opera.findAll({
    offset: (page - 1) * limit,
    limit,
    order: [
      ['operaId']
    ]
  })
  return operas
}

/**
 * 获取所有的剧本列表
 *
 * @returns
 */
const getAllOperas = async function () {
  const operas = await Opera.findAll()
  return operas
}

const getOperaByType = async function (params) {
  const operas = await Opera.findAll({
    where: params
  })
  return operas
}

const getOperaIdByType = async function (params) {
  const operas = await Opera.findAll({
    attributes: ['operaId'],
    where: params
  })
  return operas
}

const getOperaIdByName = async function (operaName) {
  const operas = await Opera.findAll({
    attributes: ['operaId', 'operaName', 'operaPeriod', 'operaTopic'],
    where: {
      operaName: {
        [Op.like]: `%${operaName}%`
      }
    }
  })
  return operas
}

module.exports = {
  getOperaList,
  getAllOperas,
  getOperaByType,
  getOperaIdByType,
  getOperaIdByName
}
