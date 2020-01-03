const qs = require('qs')
const Opera = require('../models/opera')
const Role = require('../models/role')

const OPERA_ROLE_NAME_MAP = [
  ['老生', '小生', '红生', '武生', '生', '娃娃生', '武老生', '丑生', '正生', '童生', '副生', '武小生', '大武生', '冠生', '巾生', '小官生', '官生'],
  ['老旦', '正旦', '旦', '丑旦', '花旦', '武旦', '小旦', '彩旦', '贴旦', '占旦', '刀马旦', '五旦', '四旦', '青衣', '花衫'],
  ['净', '武净', '副净', '红净', '黑净', '白面', '大面'],
  ['末', '老末'],
  ['丑', '老丑', '武丑', '小丑'],
  ['外', '老外']
].reduce((prev, curr, index) => {
  const temp = ['生', '旦', '净', '末', '丑', '外']
  for (let i = 0; i < curr.length; i++) {
    prev[curr[i]] = temp[index]
  }
  return prev
}, {})

async function getRoleData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const dataKeyMap = {
    topic: 'operaTopic',
    book: 'operaBook',
    period: 'operaPeriod'
  }
  let operaIdResult = null
  if (Array.isArray(queryParams.filterKey)) {
    operaIdResult = (await Opera.getOperaIdByType({
      [dataKeyMap[queryParams.filterKey[0]]]: queryParams.filterValue[0],
      [dataKeyMap[queryParams.filterKey[1]]]: queryParams.filterValue[1]
    })).map(v => v.operaId)
  } else {
    operaIdResult = (await Opera.getOperaIdByType({
      [dataKeyMap[queryParams.filterKey]]: queryParams.filterValue
    })).map(v => v.operaId)
  }
  const promises = operaIdResult.map(id => Role.getRolesByOperaId(id))
  const roles = (await Promise.all(promises)).reduce((prev, curr) => [...prev, ...curr], [])
  const filteredRoles = []
  // 去重
  for (const role of roles) {
    let flag = false
    for (const fRole of filteredRoles) {
      if (role.id === fRole.id) {
        flag = true
      }
    }
    if (flag) continue
    else filteredRoles.push(role)
  }
  const topLevelRoleNames = [...new Set(filteredRoles.map(v => OPERA_ROLE_NAME_MAP[v.operaRoleName]))]
  const root = {
    name: '角色-行当',
    children: topLevelRoleNames.map(v => ({ name: v, children: [] }))
  }
  for (const role of filteredRoles) {
    const topLevelRoleName = OPERA_ROLE_NAME_MAP[role.operaRoleName]
    const array = root.children.filter(v => v.name === topLevelRoleName)[0]
    let isAlreadyHasSubLevelArray = false
    if (array.children.length && array.children.filter(v => v.name === role.operaRoleName).length > 0) {
      isAlreadyHasSubLevelArray = true
    }
    if (!isAlreadyHasSubLevelArray) {
      array.children.push({
        name: role.operaRoleName,
        children: [role]
      })
    } else {
      array.children.filter(v => v.name === role.operaRoleName)[0].children.push(role)
    }
  }
  ctx.body = {
    success: true,
    data: root
  }
}

module.exports = getRoleData
