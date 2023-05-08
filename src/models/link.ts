import Sequelize, { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../database';
import User from './user';

// eslint-disable-next-line no-use-before-define
class Link extends Model<InferAttributes<Link>, InferCreationAttributes<Link>> {
  declare id: CreationOptional<number>;
  declare url: string;
  declare title: CreationOptional<string>;
  declare description: CreationOptional<string>;
  declare savedAt: CreationOptional<Date>;
  declare isPublic: boolean;
  declare userId: number;
}

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
