import { Sequelize } from 'sequelize';
import sequelize from '../database.js';
import logger from '../logger.js';
import Link from '../models/link.js';
import Tag from '../models/tag.js';

// TODO: rate limit
async function getTags(req, res, next) {
  try {
    const sortBy = req.query.sortBy || 'name';

    const orderConfig = sortBy === 'links'
      ? 'link_count DESC, LOWER(name) ASC'
      : 'LOWER(name) ASC';

    const tags = await sequelize.query(`
      SELECT t.name, COUNT(lt.linkId) as link_count
      FROM Tags t
      LEFT JOIN LinkTags lt ON t.id = lt.tagId
      GROUP BY t.id, t.name
      ORDER BY ${orderConfig}
    `, {
      type: Sequelize.QueryTypes.SELECT,
    });

    const tagNames = tags.map((tag) => tag.name);
    res.status(200).json(tagNames);
  } catch (error) {
    next(error);
  }
}


async function purgeUnusedTags(_req, res, next) {
  try {
    // Fetch all unused tags
    const unusedTags = await Tag.findAll({
      attributes: ['id'],
      include: [
        {
          model: Link,
          attributes: [],
          through: { attributes: [] },
        },
      ],
      group: ['Tag.id'],
      having: Sequelize.literal('COUNT(`Links`.`id`) = 0'),
    });

    // Extract the unused tag IDs
    const unusedTagIds = unusedTags.map((tag) => tag.id);

    // Delete the unused tags
    await Tag.destroy({
      where: {
        id: unusedTagIds,
      },
    });

    res.status(200).json({ message: 'Unused tags deleted successfully.' });
  } catch (error) {
    logger.error('Error purging unused tags:', error);
    next(error);
  }
}

export { getTags, purgeUnusedTags };
