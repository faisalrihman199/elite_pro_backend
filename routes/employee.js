var express = require('express');
var router = express.Router();
var controllers = require("../controllers");
var authmiddleware = require("../middleware/authmiddleware");
var uploadEmp = require("../middleware/employeeMiddleware");

router.get('/getInfo',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.getEmployeeInfo);
router.get('/getEmployeeModules',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.getAllEmployeeModulesPaginated);
router.delete('/delete',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.deleteEmployee);
router.put('/updateProfile',authmiddleware.authenticate('jwt', { session: false }),uploadEmp.single('file'),controllers.employee.updateEmployee);
router.get('/contactList',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.getContactList);
router.delete('/deleteMessage',authmiddleware.authenticate('jwt', { session: false }),controllers.employee.deleteMessage);

module.exports = router;