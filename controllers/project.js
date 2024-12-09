const model = require("../models");


exports.deleteProject = async (req, res) => {
    const user = req.user;
  
    // Check if the user has admin privileges
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete a project.",
      });
    }
  
    try {
      const company = await model.company.findOne({ where: { id: user.id } });
  
      // Ensure the company exists
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found.",
        });
      }
  
      const projectId = req.query.projectId;
  
      // Ensure projectId is provided
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required.",
        });
      }
  
      // Fetch the project for the given company and project ID
      const project = await model.project.findOne({
        where: { id: projectId, companyId: company.id },
      });
  
      // Check if the project exists
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found.",
        });
      }
  
      // Delete the project
      await project.destroy();
  
      // Send a success response
      return res.status(200).json({
        success: true,
        message: "Project deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
  
      // Handle unexpected errors
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the project.",
        error: error.message,
      });
    }
  };
  