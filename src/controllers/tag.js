import Tag from '../models/tag.js';

// TODO: rate limit
async function getTags(_req, res, next) {
  try {
    const tags = await Tag.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']],
    });

    const tagNames = tags.map((tag) => tag.name);
    res.status(200).json(tagNames);
  } catch (error) {
    next(error);
  }
}

export default getTags;
