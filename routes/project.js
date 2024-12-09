const express = require("express");
const router = express.Router();
const controllers = require("../controllers/index");
const authmiddleware = require("../middleware/authmiddleware")


router.delete("/delete",authmiddleware.authenticate("jwt", { session: false }),controllers.project.deleteProject)

module.exports = router