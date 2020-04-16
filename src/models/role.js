const Sequelize = require('sequelize')
const Op = Sequelize.Op
const OperaDB = require('../db')

const roleModel = '../schema/role'
const Role = OperaDB.import(roleModel)

/**
 * 根据剧本 id，获取剧本台词
 *
 * @returns
 */
const getAllRoles = async function () {
  const roles = await Role.findAll({})
  return roles
}

const getRolesByOperaId = async function (operaId) {
  const roles = await Role.findAll({
    where: {
      operaId: {
        [Op.like]: `%${operaId}%`
      }
    }
  })
  return roles
}

// const getOperaRoleByOperaIdAndRoleName = async function (operaId, roleName) {
//   const roles = await Role.findAll({
//     where: {
//       operaId: {
//         [Op.like]: `%${operaId}%`
//       }
//     }
//   })
//   return ro
// }

module.exports = {
  getAllRoles,
  getRolesByOperaId
}
