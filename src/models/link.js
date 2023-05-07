import Sequelize, { DataTypes, Model } from 'sequelize';
import sequelize from '../database.ts';
import User from './user.js';

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
      validate: { isUrl: true },
    },
    title: { type: DataTypes.STRING },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
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

export default Link;
