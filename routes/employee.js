var express = require('express');
var router = express.Router();
var controllers = require("../controllers");
var authmiddleware = require("../middleware/authmiddleware");

router.get('/getInfo',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.getEmployeeInfo);
router.get('/getEmployeeModules',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.getAllEmployeeModulesPaginated);

module.exports = router;