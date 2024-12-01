var express = require('express');
var router = express.Router();
var controllers = require("../controllers");
var authmiddleware = require("../middleware/authmiddleware");
var upload = require("../middleware/filemiddleware");
var uploadTask = require("../middleware/taskMiddleware");
var uploadEmployee = require("../middleware/employeeMiddleware");
router.post('/sendOtp', controllers.user.addCompany);
router.post('/registerCompany', controllers.user.verifyOTP);
router.post('/sendEmpOtp', controllers.user.sendEmpOtp);
router.post('/verifyEmpOtp', controllers.user.verifyEmployeeOTP);
router.post('/addEmployee',authmiddleware.authenticate('jwt', { session: false }),uploadEmployee.single('file'),controllers.user.companyAddEmployee);
router.post('/createProject',authmiddleware.authenticate('jwt', { session: false }),upload.single('file'),controllers.user.addProjectForCompany);
router.post('/addEmpToProject',authmiddleware.authenticate('jwt', { session: false }),controllers.user.addOrUpdateProjectEmployee);
router.get('/getEmployees',authmiddleware.authenticate('jwt', { session: false }),controllers.user.getAllEmployeesForCompany);
router.get('/getProjects',authmiddleware.authenticate('jwt', { session: false }),controllers.user.getAllProjectsWithEmployees);
router.post("/createTask/:projectId",authmiddleware.authenticate('jwt', { session: false }),uploadTask.single('file'),controllers.user.addTaskToProject);
router.post("/addEmpToTask",authmiddleware.authenticate('jwt', { session: false }),controllers.user.assignOrUpdateEmployeeToTask);
router.post("/addModule/:id",authmiddleware.authenticate('jwt', { session: false }),controllers.user.addOrUpdateModuleForTask);
router.post("/forgetPassword",controllers.user.forgetPassword);
router.post("/verifyForget",controllers.user.verifyForget);
router.get("/getOneTask",authmiddleware.authenticate('jwt', { session: false }),controllers.user.getOneTask);
router.get("/getOneProject",authmiddleware.authenticate('jwt', { session: false }),controllers.user.getOneProject);

module.exports = router;