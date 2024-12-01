const express = require('express');
const router = express.Router();
const controllers = require("../controllers");
const authmiddleware = require("../middleware/authmiddleware");

router.get('/mainDashboard',authmiddleware.authenticate('jwt', { session: false }),controllers.dashBoardStats.dashBoardStats);
router.get('/employeeStats',authmiddleware.authenticate('jwt', { session: false }),controllers.dashBoardStats.employeeStats);
router.get('/projectStats',authmiddleware.authenticate('jwt', { session: false }),controllers.dashBoardStats.projectStats);
router.get('/taskStats',authmiddleware.authenticate('jwt', { session: false }),controllers.dashBoardStats.taskStats);
router.get('/moduleStats',authmiddleware.authenticate('jwt', { session: false }),controllers.dashBoardStats.moduleStats);

module.exports = router;