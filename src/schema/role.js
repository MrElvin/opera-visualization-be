module.exports = (sequelize, DataTypes) => {
  return sequelize.define('role', {
    roleName: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    operaRoleName: {
      type: DataTypes.CHAR(8),
      allowNull: false
    },
    operaId: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    }
  }, {
    tableName: 'roles',
    timestamps: false
  })
}
