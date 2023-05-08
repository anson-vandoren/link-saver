import User from './user';
import Link from './link';
import Tag from './tag';

User.hasMany(Link, { foreignKey: 'userId' });
Link.belongsTo(User, { foreignKey: 'userId' });

Link.belongsToMany(Tag, { through: 'LinkTags', foreignKey: 'linkId' });
Tag.belongsToMany(Link, { through: 'LinkTags', foreignKey: 'tagId' });
