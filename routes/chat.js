var express = require('express');
var router = express.Router();
var controllers = require("../controllers");
var authmiddleware = require("../middleware/authmiddleware");


router.get('/getConversations',authmiddleware.authenticate('jwt', { session: false }),controllers.chat.getConversations);
router.get('/getOneConversation/:conversationId',authmiddleware.authenticate('jwt', { session: false }),controllers.chat.getConversationDetails);

module.exports = router;