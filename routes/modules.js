const express = require("express");
const router = express.Router();
const upload = require("../middleware/moduleMIddleware"); // Multer middleware
const authMiddleware = require("../middleware/authmiddleware"); // Authentication middleware
const controllers = require("../controllers/index"); // Controllers

// Define route for updating module progress
router.put(
    "/module-progress",
    authMiddleware.authenticate("jwt", { session: false }), // Middleware to authenticate the user
    upload.fields([
        { name: "progressFile", maxCount: 1 },
        { name: "completionFile", maxCount: 1 },
    ]), // Middleware to handle file uploads
    controllers.modules.moduleProgress
);

module.exports = router;
