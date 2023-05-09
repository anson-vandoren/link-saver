import { Op, QueryTypes } from 'sequelize';
import { JSDOM } from 'jsdom';
import sequelize from '../database.ts';
import Link from '../models/link.ts';
import User from '../models/user.ts';
import Tag from '../models/tag.ts';
import LinkTag from '../models/linkTag.ts';
import wsHandler from '../websocket.ts';
import logger from '../logger.ts';

const DEFAULT_PER_PAGE = 25;

// TODO: disallow more than 100 per request if not signed in
/**
 * Get links handler.
 * @async
 * @function
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function.
 * @throws {Error} Throws an error if there is a problem retrieving the links.
 * @returns {Promise<void>}
 */
async function getLinks(req, res, next) {
  try {
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || DEFAULT_PER_PAGE;
    const offset = (page - 1) * limit;

    const searchTerms = searchQuery.split(' ');

    const tagsFilter = searchTerms
      .filter((term) => term.startsWith('#'))
      .map((term) => term.slice(1))
      .map((tagSearch) => ({ name: { [Op.like]: `%${tagSearch}%` } }));

    const titleDescriptionUrlFilter = searchTerms
      .filter((term) => !term.startsWith('#'))
      .map((term) => ({
        [Op.or]: [
          { title: { [Op.like]: `%${term}%` } },
          { description: { [Op.like]: `%${term}%` } },
          { url: { [Op.like]: `%${term}%` } },
        ],
      }));

    const userId = req.user?.id;
    const baseClause = userId ? { userId } : { isPublic: true };

    const whereClause = {
      ...baseClause,
      [Op.and]: [...titleDescriptionUrlFilter],
    };

    if (tagsFilter.length > 0) {
      const linkIds = await sequelize.query(
        `
    SELECT lt.linkId
    FROM LinkTags lt
    INNER JOIN Tags t ON lt.tagId = t.id
    WHERE ${tagsFilter
      .map(
        (_, index) =>
          `lt.linkId IN (SELECT lt2.linkId FROM LinkTags lt2 INNER JOIN Tags t2 ON lt2.tagId = t2.id WHERE t2.name LIKE :tag${
            index + 1
          })`
      )
      .join(' AND ')}
    GROUP BY lt.linkId
  `,
        {
          replacements: tagsFilter.reduce((acc, tag, index) => {
            acc[`tag${index + 1}`] = tag.name[Op.like];
            return acc;
          }, {}),
          type: QueryTypes.SELECT,
        }
      );

      const linkIdArray = linkIds.map((link) => link.linkId);
      whereClause.id = { [Op.in]: linkIdArray };
    }

    const result = await Link.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Tag,
          through: { attributes: [] },
        },
        { model: User, attributes: ['username'] },
      ],
      order: [['savedAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const links = result.rows.map((link) => {
      const linkPlain = link.get({ plain: true });
      linkPlain.tags = linkPlain.Tags.map((tag) => tag.name);
      delete linkPlain.Tags;
      if (!userId) {
        delete linkPlain.userId;
      }
      return linkPlain;
    });

    const totalLinks = result.count;
    const data = { links, currentPage: page, totalPages: Math.ceil(totalLinks / limit) };
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getAllLinks(userId) {
  let whereClause;

  if (userId) {
    whereClause = { userId };
  } else {
    whereClause = { isPublic: true };
  }

  const links = await Link.findAll({
    where: whereClause,
    include: [
      { model: Tag, through: { attributes: [] } },
      { model: User, attributes: ['username'] },
    ],
    order: [['savedAt', 'DESC']],
  });

  return links;
}

function replaceUnusualWhitespace(text) {
  // eslint-disable-next-line no-control-regex
  const unusualWhitespaceRegex = /[\u0085\u2028\u2029\u000C\u000B]/g;
  return text.replace(unusualWhitespaceRegex, ' ');
}

function exportBookmarks(links) {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>

<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">

<TITLE>Bookmarks</TITLE>

<H1>Bookmarks</H1>

<DL><p>
`;

  const footer = '\n</DL><p>';

  const bookmarks = links
    .map((link) => {
      const { title, url, description, Tags, isPublic, savedAt } = link;

      const dt = Math.floor(new Date(savedAt).getTime() / 1000);

      const firstLine = `\t<DT><A HREF="${url}" ADD_DATE="${dt}" PRIVATE="${isPublic ? '0' : '1'}" TAGS="${Tags.join(
        ','
      )}">${title}</A>\n`;
      if (!description) {
        return firstLine;
      }
      return `${firstLine}\n\t<DD>${description}\n`;
    })
    .join('\n');

  const bookmarkHTML = header + bookmarks + footer;
  return replaceUnusualWhitespace(bookmarkHTML);
}

async function exportLinks(req, res, next) {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    const links = await getAllLinks(userId);
    logger.info('exporting links', { userId, count: links.length });
    const bookmarkHTML = exportBookmarks(links);
    res.setHeader('Content-Disposition', 'attachment; filename=bookmarks.html');
    res.setHeader('Content-Type', 'text/html');
    res.send(bookmarkHTML);
  } catch (error) {
    next(error);
  }
}

async function getLink(req, res, next) {
  try {
    const userId = req.user.id;
    logger.silly('getting link for user', { userId, linkId: req.params.id });
    const link = await Link.findOne({
      where: {
        id: req.params.id,
        UserId: userId,
      },
      include: [
        { model: User, attributes: ['username'] },
        {
          model: Tag,
          as: 'Tags',
          through: { attributes: [] }, // Exclude the LinkTag attributes
        },
      ],
    });

    if (link) {
      // Convert tags to simple array
      const tags = link.Tags.map((tag) => tag.name);
      const formattedLink = { ...link.get({ plain: true }), tags };
      res.status(200).json(formattedLink);
    } else {
      res.status(404).json({ error: { message: 'Link not found' } });
    }
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
      const description = ddElement && ddElement.tagName === 'DD' ? ddElement.textContent.trim() : '';

      bookmarks.push({
        url,
        title,
        tags,
        description,
        addDate,
        isPublic: !isPrivate,
      });
    }
  });

  return bookmarks;
}

async function addBookmarksToDatabase(bookmarks, userId) {
  // TODO: perf++: use bulkCreate or queued promises w/ concurrency control
  const sock = wsHandler.connections.get(userId);
  if (!sock) {
    logger.warn('no websocket connection found for user', { userId });
  }

  const totalBookmarks = bookmarks.length;
  const tagCache = new Map();
  let queriesSaved = 0;

  const associationsToCreate = [];
  for (let i = 0; i < totalBookmarks; i++) {
    const bookmark = bookmarks[i];
    const { url, title, tags, description, addDate, isPublic } = bookmark;

    // Add the new link to the database
    const newLink = await Link.create({
      url,
      title,
      description,
      isPublic,
      savedAt: addDate,
      userId,
    });

    // Add tags to the link
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tagId = tagCache.get(tagName);
        if (!tagId) {
          const [tagInstance] = await Tag.findOrCreate({ where: { name: tagName } });
          tagId = tagInstance.id;
          tagCache.set(tagName, tagId);
        } else {
          queriesSaved += 1;
        }
        associationsToCreate.push({ linkId: newLink.id, tagId });
      }
    }

    // Send progress update after each link creation
    if (i % 10 === 0) {
      sock?.send(
        JSON.stringify({
          type: 'import-progress',
          data: { progress: (i / totalBookmarks) * 100 },
        })
      );
    }
  }
  if (associationsToCreate.length > 0) {
    await LinkTag.bulkCreate(associationsToCreate);
  }
  logger.info(`Saved ${totalBookmarks} bookmarks to database (${queriesSaved} queries saved)`);

  // Send final progress update
  sock?.send(JSON.stringify({ type: 'import-progress', data: { progress: 100 } }));
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

export { exportLinks, getLink, getLinks, importLinks };
