const Sequelize = require('sequelize')

// 连接数据库
const { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT } = process.env
const Opera = new Sequelize(`mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/operadb`)

Opera
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err))

module.exports = Opera
