const qs = require('qs')
const Opera = require('../models/opera')
const Lyric = require('../models/lyric')
const Role = require('../models/role')

// 行当细分映射
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

async function getDetailData (ctx) {
  const queryParams = qs.parse(ctx.query)
  const { operaId } = queryParams
  const promises = [Opera.getOperaByType({ operaId }), Lyric.getLyricById(operaId), Role.getRolesByOperaId(operaId)]
  const [operaInfo, operaLyric, operaRole] = await Promise.all(promises)
  const operaLyricUse = operaLyric.map(v => ({
    id: v.id,
    speakerName: v.speakerName,
    lyricContent: v.lyricContent,
    speakType: v.speakType,
    lyricIndex: v.lyricIndex
  }))
  const allSpeakerName = getAllSpeakerName(operaLyric)
  const speakerRoleNameArray = getRoleNameByOperaId(operaRole, allSpeakerName)
  const operaRoleUse = allSpeakerName.map(role => ({
    roleName: role,
    operaRoleName: speakerRoleNameArray[role]
  }))
  const result = {
    operaInfo: operaInfo[0],
    operaLyric: operaLyricUse,
    operaRoleUse
  }
  ctx.body = {
    success: true,
    data: result
  }
}

// 根据角色名，得到行当名
function getRoleNameByOperaId (roles, allSpeakerName) {
  const map = {}
  for (let i = 0; i < allSpeakerName.length; i++) {
    const speaker = allSpeakerName[i]
    for (let j = 0; j < roles.length; j++) {
      if (speaker === roles[j].roleName) {
        map[speaker] = OPERA_ROLE_NAME_MAP[roles[j].operaRoleName]
        break
      }
      if (j === roles.length - 1) {
        map[speaker] = '其他'
      }
    }
  }
  return map
}

// 获取所有的角色（去重）
function getAllSpeakerName (lyrics) {
  const allSpeakerName = [...new Set(lyrics.map(v => v.speakerName))]
  return allSpeakerName
}

module.exports = getDetailData
