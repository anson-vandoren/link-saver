import { Sequelize } from 'sequelize';
import logger from '../logger.js';
import Link from '../models/link.js';
import Tag from '../models/tag.js';

// TODO: rate limit
async function getTags(_req, res, next) {
  try {
    const tags = await Tag.findAll({
      attributes: ['name'],
      order: [[Sequelize.fn('lower', Sequelize.col('name')), 'ASC']],
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
