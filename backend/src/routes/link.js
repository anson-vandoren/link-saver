const express = require('express');
const { createLink, getLink, getLinks, updateLink, deleteLink } = require('../controllers/link');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, createLink);
router.get('/', authenticate, getLinks);
router.get('/:id', authenticate, getLink);
router.put('/:id', authenticate, updateLink);
router.delete('/:id', authenticate, deleteLink);

module.exports = router;
