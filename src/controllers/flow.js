const fs = require('fs')
const qs = require('qs')
const Opera = require('../models/opera')
const Role = require('../models/role')
const Lyric = require('../models/lyric')

// 公式：角色权重 * 唱腔权重 * log(本轮对话字数)

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

const getSingItemMapValue = () => {
  // 五种唱腔的字符串值，之后需要做匹配
  const YQ = '叫头、笑、哭、哭板、同笑、三笑、同哭、三叫头、叫哭、叫板、同三叫头、同哭板、哭头、同哭头、同叫头、内喊、内哭、吐、对哭、叫、西皮哭板、同三笑、三叫头哭板、哭洒头、哭腔、三哭、内同哭、内同笑、内三叫头、内笑、内叫、叹、悲号、苦笑、强笑、冷笑、同喊、大叫、干哭头、惊叫、干笑、哭叫、喊、内双叫头、慢叫头、西皮哭头、梦语'
  const NB = '念、白、同白、内白、数板、同念、内同白、净白、白)、内同念、同合头、煞尾、夹白、同煞尾、苏白、内杭白、杭白、滑稽外国白、苏州京白、合头、幺篇、内念、京白、内白、内同京白、同京白、同内白、白：、同数板、数板)、内同白)、韵白、扬州白、快书、白内、内、分念、浪里来煞尾、同夹白、浪里来煞、高过随调煞、拨子'
  const YZ = '引子、同引子、引、南吕宫调一剪梅引子、南吕宫调步蟾宫引子、南吕宫调生查子引子、诗、破阵子引、夜行船引、同破阵子引、大引子'
  const QP = '川拨棹、梅花酒、哭和尚、水龙吟、六么令、挂三钩、太平令、点绦唇、川拨掉、扑灯蛾、同点绛唇、点绛唇、小锣数、新水令、折桂令、雁儿落、收江南、园林好、同园林好、风入松、锁南枝、红衲袄、赏花时、清江引、金上花、同斗鹌鹑、同小桃红、小桃红、斯乐王、路修外、细点降、同寄生草、同锁南枝、同打落子、打落子、同铺红灯、铺红灯、锦中帕、同锦中帕、同耍孩儿、斗鹌鹑、菩萨蛮、虞美人、步步娇、急三枪、出队子、粉蝶儿、醉春风、迎仙客、石榴花、红绣鞋、十二月、尧民歌、快活三、朝天子、玉美情人、一江风、绕池游、万佛会、内北一枝花、北一枝花、叨叨令、脱布衫、小梁州、鸟夜啼、渔家傲、内赏花诗、赏花诗、 玉芙蓉、快点绛唇、醉花荫、驻马听、金蕉叶、秃廝儿、南吕宫调懒画眉、同南吕宫调懒画眉、仙吕宫调解三酲、榴花泣、如梦令、南吕宫调宜春令、南吕宫调梁州序、高宫调脱布衫、高宫调小梁州、越调梨花儿、黄钟调耍孩儿、黄钟调五煞、黄钟调四煞、黄钟调三煞、黄钟调二煞、黄钟调一煞、仙吕宫调清江引、圣药王、〖点绛唇〗、普贤歌、挂葫芦、水底鱼、同石榴花、仙吕宫调点绛唇、双调新水令、雁儿落带得胜令、沽美酒带太平令、记吾乡、同泣颜回、皂罗袍、同六么令、红弓鞋、八声甘州歌、同驻云飞、同鲍老催、水仙子、同红芍药、耍孩儿、会河阳、驻云飞、黄龙滚、剔银灯、滚江龙、寄生草、泣颜回、同喜迁莺、同刮地风、同驻马听、同胡十八、同清江尾、内同新水令、同雁儿落、山坡羊、同山坡羊、不是路、内掉角儿、梁州序、忒忒令、同忒忒令、吉庆子、同吉庆子、玉交枝、同玉交枝、楚江吟、牧羊关、同沽美酒、同清江引、采莲歌、解三酲、快索南枝、宜春令、天下乐、胜葫芦、尾犯序、同尾犯序、滚绣球、脱为裕、小梁舟、鹊踏枝、风吹荷叶煞、掉角儿、油葫芦、哪吒令、千秋岁、侥侥令、金钱花、同粉蝶儿、浪淘沙、得胜令、沽美酒、会蓬莱合头、缕缕金、古轮台、五更转、扑灯娥、南笛儿、下山虎、五般宜、小蔴楷、五供养、蛮牌令、采芙蓉、莲花落、梆子腔、桂枝香、太师引、江头金桂、 四边静、集贤宾、梧叶儿、柳叶儿、同哭相思、 锦金香、端正好、同新水令、同折桂令、 混江龙、同四门子、四门子、同玉芙蓉、醉花阴、画眉序、喜迁莺、滴溜子、刮地风、滴滴金、鲍老催、同水仙子、双声子、叠字犯、同扑灯蛾、上小楼、叠字令、同〖点绛唇〗、〖粉蝶儿〗、同五马江儿水、同油葫芦、道情歌、豹子令、同豹子令、同出队子、同牧羊关、同八声甘州歌、同江儿水、红芍药、同踏破锦地花、踏破锦地花、同红绣鞋、同八声甘州、北粉蝶儿、忆秦娥、同玉姣枝、内八声甘州、玉娇枝、川拔棹、满江红、扑灯蛾牌、内哪吒令、鹊尾犯、雁儿煞、同越恁好、玉山颓、同凯旋歌、同七队子、同缕缕金、内同点绛唇、调笑令、同调笑令、杏花天、斗鹌鹁、上下楼、七弟兄、鸳鸯煞、同上小楼、青天歌、六字调淘金令、红衫儿、东瓯令、后庭花、香柳娘、一枝花、搅筝琶、北集贤宾、逍遥乐、金菊香、醋葫芦、同秃厮儿、北点绛唇、南缕缕金、北小桃红、同南缕缕金、紫花儿序、双调雁儿落带得胜令、白鹤子、倘秀才、上字调粉蝶儿、铧锹儿、谒金门、同神仗儿、同回回曲、惜花赚、嘉庆子、豆叶黄、同川拨棹、同金钱花、金珑璁、刮鼓令、鹧鸪天、一剪梅、朝元歌、水红花、五韵美、忆多娇、倾杯玉芙蓉、同刷子芙蓉、锦芙蓉、同雁芙蓉、小桃映芙蓉、同普天芙蓉、朱奴插芙蓉、商调集贤宾、上京马、醉葫芦、枫叶儿、浪里来、武陵花、黄钟·醉花荫、同梅花酒、同七兄弟、同一缕麻、一缕儿麻、同乔牌儿、彩衣舞、沽酒令、同沽酒令、穿花蝶、内山坡羊、同千秋岁、庆东元、节节高、小蓬莱、临镜序、脱布衫带叨叨令、雁儿得胜、点将唇、点降唇、揽筝琶、同念奴娇、庆东原、山桃花、同山桃红、绵搭絮、快点绛、同滚绣球、同五般宜、同滴溜子、同画眉序、山桃红、同皂罗袍、同醉扶归、小上楼、绕地游、醉扶归、风马儿、同黄莺儿、黄莺儿、啼莺儿、琥珀猫儿坠、快风入松、同风入松、脱布衫接叨叨令、越恁好、同侥侥令、哭相思、哪叱令、一封书、高拨子、同庆余、伴读书、呆骨朵、字字停春色、沐木儿、同收江南、同点绦唇、江儿水、哭皇天、好姐姐、懒画眉、同梁州序、同梁洲序、紧风入松、出对子、九转货郎儿、同解三酲、同唐多令、内同泣颜回、上字调新水令、骂王郎、四块玉、沉醉东风、同十三咳、八声甘州、梁州第七、水龙吟又一体、内同二犯江水儿、同二犯江水儿、同一江风、同梅花板、梅花板、唱琴歌、凤求凰琴曲、钗头凤词、易水歌、胡十八、尹令、品令、三月海棠、二犯六么令、小工调步步娇、同太师引、尾犯玉芙蓉、调角儿、十二红、同朝元歌'
  const CF = '内西皮摇板、原板、西皮接板、同二黄原板、西皮摇板、内西皮导板、西皮快板、西皮慢板、西皮原板、西皮二六板、二黄原板、二黄摇板、二黄导板、二黄慢板、二黄快三眼、反二黄慢板、反二黄原板、西皮流水板、西皮导板、同西皮摇板、快西皮摇板、慢西皮摇板、二黄垛板、二黄平板、内二黄导板、回龙、快西皮原板、同二黄摇板、二黄散板、反二黄摇板、内二黄摇板、二黄叠板、反西皮摇板、西皮散板、同二黄平板、小调、同西皮散板、西皮快三眼、昆腔、梆子导板、垛板、吹腔尾声、唱、西皮紧板、花梆子原板、断板腔、吹腔、尾声、西皮小慢板、内唱、二黄摇唱、同回龙、同西皮原板、乱西皮导板、同西皮快板、双西皮导板、干板、西皮原扳、南梆子慢板、南梆子原板、南梆子摇板、西皮慢三眼、西皮接唱、回龙腔慢板、同唱、梆子摇板、二黄慢三眼、南梆子导板、西皮滚板、二黄倒板、西皮摇扳、同西皮导板、西紧摇板、西皮正板、顶板回龙、吹腔慢板、梆子流水板、内梆子导板、梆子原板、小曲、京调、西皮锁板、梆子慢板、同吹腔、二黄正板、四平调、南梆子、二黄顶板、西皮倒板、梆子正板、西皮顶板、大回龙、反二黄正板、同二黄正板、高拨子摇板、快调、吴歌、高拨子顶板、二黄三眼、秦腔渐板、秦腔慢板、梆子二六板、反西皮快板、反二黄散板、同二黄散板、同尾声、西皮收板、西皮平板、梆子尖板、西皮三眼、西皮搖板、山西梆子调、西皮摇板)、接唱、西皮三眼板、二黄慢三眼板、西皮慢三眼板、内唢呐二黄导板、唢呐二黄原板、反二黄三眼、内同南梆子、同南梆子、唢呐二黄散板、二黄原版、西皮小导板、反西皮二六板、二黄小导板、西皮快二六板、二簧原板、反二黄三眼板、二黄回龙三眼、内南梆子导板、西上散板、西皮摇板转回龙、二黄碰板三眼、内西皮散板、內西皮导板、西皮快流水板、西皮块板、反西皮垛板、汉调原板、唢呐二黄导板、内高拨子导板、高拨子垛板、高拨子原板、高拨子散板、二黄二六板、西皮垛板、西皮慢流水板、二黄顶板快三眼、西皮跺板、西皮散扳、高拨子导板、内二黄平板、西皮垛板流水板、同西皮流水板、二黄碰板、唱)、二黄三眼板、二黄回龙、内锁呐二黄导板、內二黄导板、反二黄快三眼、唱〉、散板、内西皮小导板、同四平调、回龙腔、西皮流水、摇板、内二黄异板、高拨子二六板、反四平调、转西皮二六板、内同西皮摇板、反西皮二六、内反二黄导板、反回龙、同散西皮板、同高拨子导板、碰板二黄原板、反二黄碰板三眼、二黄滚板、西皮娃娃调原板、反西皮散板、西皮过板、西皮慢原板、同二黄三眼、快四平调、西皮小快板、反二黄快板、内二黄小导板、内四平调、西皮顶板回龙、西皮散板哭头、内二黄散板、快西皮二六板、二黄快板、西皮快原板、二黄汉调、西皮汉调、西皮二六、内同唱、反四平调佳期颂、反汉调听琴吟、同哭唱、樵歌、灯歌、山歌、唱歌、内同伴唱、同大锁呐曲子、大唢呐曲子、同大唢呐曲子、干唱、山西梆子、高拨子碰板、高拨子回龙、赚'
  const ALL_TYPE_STR = [YQ, NB, YZ, QP, CF]
  // 0: YQ, 1: NB, 2: YZ, 3: QP, 4: CF
  const SING_VALUE_MAP = [1, 2, 3, 4, 5]
  const result = {}
  for (let i = 0; i < ALL_TYPE_STR.length; i++) {
    const singItems = ALL_TYPE_STR[i].split('、')
    for (let j = 0; j < singItems.length; j++) {
      result[singItems[j]] = SING_VALUE_MAP[i]
    }
  }
  return result
}
// 唱腔权重映射表
const SING_ITEM_MAP = getSingItemMapValue()

// 计算以 x 为底，y 的对数
const baseLog = (x, y) => Math.log(y) / Math.log(x)

// 通过搜索获取一系列的 flowData
async function getFlowDataBySearchName (ctx) {
  const queryParams = qs.parse(ctx.query)
  const searchValue = queryParams.searchValue
  if (!searchValue) {
    const result = JSON.parse(fs.readFileSync('./allFlowData.json'))
    ctx.body = result
  } else {
    const operas = await Opera.getOperaIdByName(searchValue)
    if (!operas.length) {
      ctx.body = {
        success: true,
        data: []
      }
    }
    const operaIds = operas.map(v => v.operaId)
    const promises = operaIds.map(id => getFlowDataById(id))
    const flowData = await Promise.all(promises)
    flowData.forEach((v, i) => {
      v.operaId = operas[i].operaId
      v.operaName = operas[i].operaName
      v.operaPeriod = operas[i].operaPeriod
      v.operaTopic = operas[i].operaTopic
    })
    // fs.writeFileSync('./allFlowData.json', JSON.stringify({
    //   success: true,
    //   data: flowData
    // }))
    ctx.body = {
      success: true,
      data: flowData
    }
  }
}

// 获取某个 operaId 的 flowData
async function getFlowDataById (operaId) {
  const lyrics = await Lyric.getLyricById(operaId)
  // 修正 lyrics 的编号，因为之前操作数据库，可能导致了编号错乱
  lyrics.forEach((lyric, index) => (lyric.lyricIndex = index))
  // 获取该京剧剧本下所有角色的权重信息以及行当信息
  const allSpeakerName = getAllSpeakerName(lyrics)
  const speakerWeightArray = getSpeakerWeight(lyrics, allSpeakerName)
  const spearkerRoleNameArray = await getRoleNameByOperaId(operaId, allSpeakerName)
  const speakerMap = mixinWeightRoles(allSpeakerName, speakerWeightArray, spearkerRoleNameArray)
  const flowData = []
  let singWords = 0
  let readWords = 0
  const roleNameIncluded = [...new Set(Object.keys(speakerMap).map(v => speakerMap[v].roleName))]
  for (let i = 0; i < lyrics.length; i++) {
    const lyric = lyrics[i]
    const speakerRoleName = speakerMap[lyric.speakerName].roleName
    const speakerWeight = speakerMap[lyric.speakerName].weight
    const speakTypeWeight = SING_ITEM_MAP[lyric.speakType]
    const speakLyricWeight = baseLog(2, lyric.lyricContent.length)
    if (speakTypeWeight > 3) singWords += lyric.lyricContent.length
    else readWords += lyric.lyricContent.length
    const item = {
      index: i,
      speaker: lyric.speakerName,
      speakerRoleName,
      speakerWeight,
      speakType: lyric.speakType,
      speakTypeWeight,
      speakLyricWeight,
      lyricValue: speakerWeight * speakTypeWeight * speakLyricWeight,
      lyricValueInspect: `${speakerWeight} - ${speakTypeWeight} - ${lyric.lyricContent.length} - ${speakLyricWeight}`
    }
    flowData.push(item)
  }
  // 判断是否是以唱为主的剧本，唱和曲牌的字数大于其他的，则判定为以唱为主
  return ({
    flowData,
    readWords,
    singWords,
    roleNameIncluded
  })
}

// 将角色的权重和行当混合在一起，便于之后查找数值
function mixinWeightRoles (allSpeakerName, weights, roles) {
  const map = {}
  for (let i = 0; i < allSpeakerName.length; i++) {
    const speaker = allSpeakerName[i]
    map[speaker] = {
      weight: weights[speaker],
      roleName: roles[speaker]
    }
  }
  return map
}

// 获取一个剧本内每个角色的权重
function getSpeakerWeight (lyrics, allSpeakerName) {
  // 角色对应的台词字数 map
  const map = {}
  for (let i = 0; i < allSpeakerName.length; i++) {
    const speaker = allSpeakerName[i]
    const lyric = lyrics.filter(v => v.speakerName === speaker).map(v => v.lyricContent).join('')
    map[speaker] = lyric.length
  }
  // 进行归一化处理
  const lyricsTotalLength = lyrics.map(v => v.lyricContent).join('').length
  Object.keys(map).forEach(key => (map[key] = Math.ceil((map[key] / lyricsTotalLength) * 10)))
  return map
}

// 根据 operaId 和角色名，得到行当名
async function getRoleNameByOperaId (operaId, allSpeakerName) {
  const roles = await Role.getRolesByOperaId(operaId)
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

// 获取所有的唱腔类别
async function getAllSpeakType (ctx) {
  const result = (await Lyric.getAllLyricSpeakType()).map(v => v.dataValues.speakTypeDistinct)
  ctx.body = {
    success: true,
    data: result
  }
}

module.exports = getFlowDataBySearchName
