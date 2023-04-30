import { Model } from 'sequelize';
import sequelize from '../database.js';
import Link from './link.js';
import Tag from './tag.js';

class LinkTag extends Model {}

LinkTag.init(
  {},
  {
    sequelize,
    modelName: 'LinkTag',
  },
);

Link.belongsToMany(Tag, { through: LinkTag, foreignKey: 'linkId' });
Tag.belongsToMany(Link, { through: LinkTag, foreignKey: 'tagId' });

export default LinkTag;
