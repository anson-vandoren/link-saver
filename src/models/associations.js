import User from './user.ts';
import Link from './link.ts';
import Tag from './tag.js';

User.hasMany(Link, { foreignKey: 'userId' });
Link.belongsTo(User, { foreignKey: 'userId' });

Link.belongsToMany(Tag, { through: 'LinkTags', foreignKey: 'linkId' });
Tag.belongsToMany(Link, { through: 'LinkTags', foreignKey: 'tagId' });
