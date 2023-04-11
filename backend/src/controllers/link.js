const Link = require('../models/link');
const User = require('../models/user');
const { JSDOM } = require('jsdom');

async function createLink(req, res, next) {
  try {
    const { url, title, tags, isPublic, description } = req.body;
    const userId = req.user.id;

    const newLink = await Link.create({ url, title, tags, isPublic, description, userId });

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

    const filteredLinks = links.filter(
      (link) =>
        link.title.includes(searchQuery) || link.tags.some((tag) => tag.includes(searchQuery))
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
        UserId: req.user.id,
      },
      include: [{ model: User, attributes: ['email'] }],
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

function parseNetscapeHTML(htmlContent) {
  const bookmarks = [];
  const dom = new JSDOM(htmlContent);
  const dtElements = dom.window.document.querySelectorAll('DT');

  dtElements.forEach((dtElement) => {
    const aElement = dtElement.querySelector('A');
    if (aElement) {
      const url = aElement.getAttribute('href');
      const title = aElement.textContent.trim();
      const tags = (aElement.getAttribute('tags') || '').split(',').map((tag) => tag.trim());
      const addTimestamp = aElement.getAttribute('add_date');
      const addDate = addTimestamp ? new Date(parseInt(addTimestamp, 10) * 1000) : new Date();
      const isPrivate = aElement.getAttribute('private') === '1';

      const ddElement = dtElement.nextElementSibling;
      const description =
        ddElement && ddElement.tagName === 'DD' ? ddElement.textContent.trim() : '';

      bookmarks.push({ url, title, tags, description, addDate, isPublic: !isPrivate });
    }
  });

  return bookmarks;
}

async function addBookmarksToDatabase(bookmarks, userId) {
  for (const bookmark of bookmarks) {
    const { url, title, tags, description, addDate } = bookmark;

    // Add the new link to the database
    await Link.create({
      url,
      title,
      tags,
      description,
      savedAt: addDate,
      userId,
    });
  }
}

async function importLinks(req, res, next) {
  if (!req.file) {
    return next(new Error('No file uploaded'));
  }

  const htmlContent = req.file.buffer.toString();
  const bookmarks = parseNetscapeHTML(htmlContent);
  await addBookmarksToDatabase(bookmarks, req.user.id);

  return res.status(200).json({ message: 'Links imported successfully' });
}

module.exports = {
  createLink,
  getLink,
  getLinks,
  updateLink,
  deleteLink,
  importLinks,
};
