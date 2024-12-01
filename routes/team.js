const controllers = require("../controllers");
const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/authmiddleware");

router.post("/create",authmiddleware.authenticate('jwt', { session: false }),controllers.team.createTeam);
router.get("/getOneTeam/:teamId",authmiddleware.authenticate('jwt', { session: false }),controllers.team.getOneteam);
router.get("/all",authmiddleware.authenticate('jwt', { session: false }),controllers.team.fetchTeamsForCompany);
router.delete("/delete/:teamId",authmiddleware.authenticate('jwt', { session: false }),controllers.team.deleteTeam);
router.post("/addEmp",authmiddleware.authenticate('jwt', { session: false }),controllers.team.addEmployeeToTeam);
router.get("/getTeamMembers/:teamId",authmiddleware.authenticate('jwt', { session: false }),controllers.team.fetchTeamMembers);
router.delete("/removeEmp",authmiddleware.authenticate('jwt', { session: false }),controllers.team.removeEmployeeFromTeam);
router.post("/addToProject",authmiddleware.authenticate('jwt', { session: false }),controllers.team.addTeamToProject);
router.delete("/removeFromProject",authmiddleware.authenticate('jwt', { session: false }),controllers.team.removeTeamFromProject);


module.exports = router;
