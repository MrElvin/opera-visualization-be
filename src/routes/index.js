const router = require('koa-router')()

// 处理函数
const controllerList = require('../controllers/list')
const controllerSankey = require('../controllers/sankey')
const controllerWordcloud = require('../controllers/wordcloud')
const controllerRelation = require('../controllers/relation')
const controllerFinger = require('../controllers/finger')
const controllerFlow = require('../controllers/flow')
const controllerDetail = require('../controllers/detail')
const controllerDrawer = require('../controllers/drawer')

// 设置路由
router.get('/api/list', controllerList)
router.get('/api/sankey', controllerSankey)
router.get('/api/wordcloud', controllerWordcloud)
router.get('/api/relation', controllerRelation)
router.get('/api/finger', controllerFinger)
router.get('/api/flow', controllerFlow)
router.get('/api/detail', controllerDetail)
router.get('/api/drawer', controllerDrawer)

module.exports = router
