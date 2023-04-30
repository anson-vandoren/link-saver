import User from './user.js';
import Link from './link.js';
import Tag from './tag.js';

User.hasMany(Link, { foreignKey: 'userId' });
Link.belongsTo(User, { foreignKey: 'userId' });

Link.belongsToMany(Tag, { through: 'LinkTags', foreignKey: 'linkId' });
Tag.belongsToMany(Link, { through: 'LinkTags', foreignKey: 'tagId' });
