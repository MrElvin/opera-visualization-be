const Opera = require('../models/opera')
const fs = require('fs')

const getSankeyData = async ctx => {
  const result = fs.readFileSync('./sankeyData.json')
  ctx.body = {
    success: true,
    data: JSON.parse(result)
  }
}

// const getSankeyData = async ctx => {
//   const allOperas = await Opera.getAllOperas()
//   const nodes = generateNodes(allOperas)
//   const period2TopicLinks = await genPeriod2TopicLinks(nodes)
//   const topic2BookLinks = await genTopic2BookLinks(nodes)
//   const links = [...period2TopicLinks, ...topic2BookLinks]
//   fs.writeFileSync('./sankeyData.json', JSON.stringify({ nodes, links }))
//   ctx.body = {
//     success: true,
//     data: null
//   }
// }

function generateNodes (allOperas) {
  const nodes = []
  const periods = []
  const topics = []
  const books = []
  for (let i = 0; i < allOperas.length; i++) {
    const item = allOperas[i]
    if (periods.indexOf(item.operaPeriod) === -1) {
      periods.push(item.operaPeriod)
    }
    if (topics.indexOf(item.operaTopic) === -1) {
      topics.push(item.operaTopic)
    }
    if (books.indexOf(item.operaBook) === -1) {
      books.push(item.operaBook)
    }
  }
  let index = 0
  for (let i = 0; i < periods.length; i++) {
    nodes.push({
      type: 'period',
      id: index++,
      name: periods[i]
    })
  }
  for (let i = 0; i < topics.length; i++) {
    nodes.push({
      type: 'topic',
      id: index++,
      name: topics[i]
    })
  }
  for (let i = 0; i < books.length; i++) {
    nodes.push({
      type: 'book',
      id: index++,
      name: books[i]
    })
  }
  return nodes
}

async function genPeriod2TopicLinks (nodes) {
  const periodsNodes = nodes.filter(v => v.type === 'period')
  const topicNodes = nodes.filter(v => v.type === 'topic')
  const links = []
  for (let i = 0; i < periodsNodes.length; i++) {
    const source = periodsNodes[i]
    for (let j = 0; j < topicNodes.length; j++) {
      const target = topicNodes[j]
      const searchResult = await Opera.getOperaByType({
        operaPeriod: source.name,
        operaTopic: target.name
      })
      links.push({
        source: source.id,
        target: target.id,
        value: searchResult.length
      })
    }
  }
  return links.filter(v => v.value > 0)
}

async function genTopic2BookLinks (nodes) {
  const topicNodes = nodes.filter(v => v.type === 'topic')
  const booksNodes = nodes.filter(v => v.type === 'book')
  const links = []
  for (let i = 0; i < topicNodes.length; i++) {
    const source = topicNodes[i]
    for (let j = 0; j < booksNodes.length; j++) {
      const target = booksNodes[j]
      const searchResult = await Opera.getOperaByType({
        operaTopic: source.name,
        operaBook: target.name
      })
      links.push({
        source: source.id,
        target: target.id,
        value: searchResult.length
      })
    }
  }
  return links.filter(v => v.value > 0)
}

module.exports = getSankeyData
