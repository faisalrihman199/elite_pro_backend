var express = require('express');
var router = express.Router();
var company = require('./company');
var chat = require('./chat')
var dashboard = require('./dashboard')
var teams = require('./team')
var employee = require('./employee')
var modules = require('./modules')
const controllers = require("../controllers");

router.use('/chat',chat);
router.use('/company',company);
router.post('/login',controllers.user.login)
router.use('/dashboard',dashboard);
router.use('/teams',teams);
router.use('/employee',employee);
router.use('/modules',modules);

module.exports = router;
