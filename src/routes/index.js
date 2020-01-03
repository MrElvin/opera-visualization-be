const router = require('koa-router')()

// 处理函数
const controllerList = require('../controllers/list')
const controllerSankey = require('../controllers/sankey')
const controllerWordcloud = require('../controllers/wordcloud')
const controllerRelation = require('../controllers/relation')
const controllerFinger = require('../controllers/finger')
const controllerFlow = require('../controllers/flow')

// 设置路由
router.get('/api/list', controllerList)
router.get('/api/sankey', controllerSankey)
router.get('/api/wordcloud', controllerWordcloud)
router.get('/api/relation', controllerRelation)
router.get('/api/finger', controllerFinger)
router.get('/api/flow', controllerFlow)

module.exports = router
