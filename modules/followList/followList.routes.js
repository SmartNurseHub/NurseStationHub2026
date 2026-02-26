// modules/followList/followList.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./followList.controller');

router.get('/', controller.getFollowList);

module.exports = router;