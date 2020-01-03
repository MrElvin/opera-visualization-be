module.exports = (sequelize, DataTypes) => {
  return sequelize.define('lyric', {
    operaId: {
      type: DataTypes.CHAR(8),
      allowNull: false,
      primaryKey: true
    },
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    speakerName: {
      type: DataTypes.CHAR(255),
      allowNull: false
    },
    lyricContent: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    speakType: {
      type: DataTypes.CHAR(50),
      allowNull: false
    },
    speakerCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    lyricIndex: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
    tableName: 'lyrics',
    timestamps: false
  })
}
