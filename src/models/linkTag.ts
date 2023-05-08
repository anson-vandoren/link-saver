import { ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../database';
import Link from './link';
import Tag from './tag';

// eslint-disable-next-line no-use-before-define
class LinkTag extends Model<InferAttributes<LinkTag>, InferCreationAttributes<LinkTag>> {
  declare linkId: ForeignKey<number>;
  declare tagId: ForeignKey<number>;
}

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
