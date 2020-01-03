const path = require('path')
const Koa = require('koa')
const json = require('koa-json')
const logger = require('koa-logger')
const onerror = require('koa-onerror')
const dotenv = require('dotenv')

// 后端端口号设置，.env 文件设置
const PORT = 4000
const envPath = path.resolve('.env')
dotenv.config({ path: envPath })

const app = new Koa()
const router = require('./src/routes')

// 中间件
onerror(app)
app.use(json())
app.use(logger())

// 日志
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// 路由
app.use(router.routes(), router.allowedMethods())

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
})

// 监听
app.listen(PORT, () => {
  console.log('server is running...')
  console.log('visit http://localhost:' + PORT + '/')
})
