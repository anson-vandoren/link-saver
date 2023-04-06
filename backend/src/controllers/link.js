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

    const links = await Link.findAll({
      where: { userId },
      include: [{ model: User, attributes: ['email'] }],
    });

    res.status(200).json({ links });
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
  getLinks,
  updateLink,
  deleteLink,
};
