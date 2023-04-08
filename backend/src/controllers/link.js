const { Op } = require('sequelize');
const Link = require('../models/link');
const User = require('../models/user');

async function createLink(req, res, next) {
  try {
    const { url, title, tags, isPublic } = req.body;
    const userId = req.user.id;

    const newLink = await Link.create({ url, title, tags, isPublic, userId });

    res.status(201).json({ message: 'Link created successfully', link: newLink });
  } catch (error) {
    next(error);
  }
}

async function getLinks(req, res, next) {
  try {
    const userId = req.user.id;
    const searchQuery = req.query.search || '';

    const links = await Link.findAll({
      where: { userId },
      include: [{ model: User, attributes: ['email'] }],
    });

    const filteredLinks = links.filter(link =>
      link.title.includes(searchQuery) ||
      link.tags.some(tag => tag.includes(searchQuery))
    );

    res.status(200).json({ links: filteredLinks });
  } catch (error) {
    next(error);
  }
}



async function getLink(req, res, next) {
  try {
    const link = await Link.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      },
      include: [{ model: User, attributes: ['email'] }]
    });

    if (link) {
      res.status(200).json(link);
    } else {
      res.status(404).json({ error: { message: 'Link not found' } });
    }
  } catch (error) {
    next(error);
  }
}

async function updateLink(req, res, next) {
  try {
    const { id } = req.params;
    const { url, title, tags, isPublic } = req.body;
    const userId = req.user.id;

    const link = await Link.findOne({ where: { id, userId } });
    if (!link) {
      return res.status(404).json({ error: { message: 'Link not found' } });
    }

    await link.update({ url, title, tags, isPublic });

    res.status(200).json({ message: 'Link updated successfully', link });
  } catch (error) {
    next(error);
  }
}

async function deleteLink(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const link = await Link.findOne({ where: { id, userId } });
    if (!link) {
      return res.status(404).json({ error: { message: 'Link not found' } });
    }

    await link.destroy();

    res.status(200).json({ message: 'Link deleted successfully', link });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  createLink,
  getLink,
  getLinks,
  updateLink,
  deleteLink,
};
