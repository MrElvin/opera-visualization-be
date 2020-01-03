module.exports = (sequelize, DataTypes) => {
  return sequelize.define('opera', {
    operaId: {
      type: DataTypes.CHAR(8),
      allowNull: false,
      primaryKey: true
    },
    operaName: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    operaPeriod: {
      type: DataTypes.CHAR(50),
      allowNull: false,
      primaryKey: true
    },
    operaSource: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    operaBrief: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    operaComment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    operaBook: {
      type: DataTypes.CHAR(50),
      allowNull: true
    },
    operaTopic: {
      type: DataTypes.ENUM('儿女缠绵', '世俗生活', '政治斗争', '军事风云', '神话传说', '草莽英雄'),
      allowNull: true
    }
  }, {
    tableName: 'operas',
    timestamps: false
  })
}
