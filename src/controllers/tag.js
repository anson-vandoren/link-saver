import { Sequelize } from 'sequelize';
import sequelize from '../database.ts';
import logger from '../logger.ts';
import Link from '../models/link.ts';
import Tag from '../models/tag.ts';

// TODO: rate limit
async function getTags(req, res, next) {
  try {
    const sortBy = req.query.sortBy || 'name';
    const searchQuery = req.query.search || '';

    const searchTerms = searchQuery.split(' ');

    const titleUrlFilter = searchTerms
      .filter((term) => !term.startsWith('#') && term !== '')
      .map((term) => `(l.title LIKE :${term} OR l.description LIKE :${term} OR l.url LIKE :${term})`)
      .join(' AND ');

    const tagsFilter = searchTerms
      .filter((term) => term.startsWith('#'))
      .map((term) => term.slice(1))
      .map((tagSearch, index) => `(SELECT COUNT(*) FROM LinkTags lt2 INNER JOIN Tags t2 ON lt2.tagId = t2.id WHERE lt2.linkId = l.id AND t2.name LIKE :tagTerm${index}) = 1`)
      .join(' AND ');

    const whereClause = `
      WHERE (${titleUrlFilter.length > 0 ? titleUrlFilter : '1=1'})
      ${tagsFilter.length > 0 ? `AND (${tagsFilter})` : ''}
    `;

    const replacements = searchTerms.reduce((acc, term) => {
      if (!term.startsWith('#') && term !== '') {
        acc[term] = `%${term}%`;
      }
      return acc;
    }, {});

    searchTerms
      .filter((term) => term.startsWith('#'))
      .map((term) => term.slice(1))
      .forEach((tagSearch, index) => {
        replacements[`tagTerm${index}`] = `%${tagSearch}%`;
      });

    const tags = await sequelize.query(`
      SELECT t.name, COUNT(lt.linkId) as link_count
      FROM Tags t
      LEFT JOIN LinkTags lt ON t.id = lt.tagId
      LEFT JOIN Links l ON lt.linkId = l.id
      ${whereClause}
      GROUP BY t.id, t.name
      HAVING link_count > 0
      ORDER BY ${sortBy === 'links' ? 'link_count DESC, LOWER(name) ASC' : 'LOWER(name) ASC'}
    `, {
      replacements,
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
