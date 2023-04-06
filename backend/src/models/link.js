const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../database');
const User = require('./user');

class Link extends Model {}

Link.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    title: {
      type: DataTypes.STRING,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        return JSON.parse(this.getDataValue('tags') || '[]');
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      },
    },
    savedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Link',
  },
);

User.hasMany(Link, { foreignKey: 'userId' });
Link.belongsTo(User, { foreignKey: 'userId' });

module.exports = Link;
