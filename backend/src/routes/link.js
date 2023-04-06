const express = require('express');
const { createLink, getLinks, updateLink, deleteLink } = require('../controllers/link');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticate, createLink);
router.get('/', authenticate, getLinks);
router.put('/:id', authenticate, updateLink);
router.delete('/:id', authenticate, deleteLink);

module.exports = router;
