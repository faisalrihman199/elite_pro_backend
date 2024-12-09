const model = require('../models');



exports.assignEmployeeToModule = async (req, res) => {
    const user = req.user;
    if(req.user.role !== "admin"){
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { employeeId, moduleId } = req.body;
    try {

        const existingMembership = await model.employeeModuleAssignment.findOne({where:{moduleId}});
        if(existingMembership){
            if(existingMembership.employeeId === employeeId){
                return res.status(400).json({ success: false, message: "Employee already assigned to module" });
            }
            else{
                existingMembership.employeeId = employeeId;
                await existingMembership.save();
                return res.status(200).json({ success: true, message: "Employee updated to module successfully" });
            }
        }
        const employeeModule = await model.employeeModuleAssignment.create({employeeId, moduleId});
        return res.status(200).json({ success: true, message: "Employee assigned to module successfully" ,
            data: employeeModule

        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while assigning employee to module.",
            error: error.message,
        });
    }
}


exports.moduleProgress = async (req, res) => {
    const user = req.user;
    let status = "in-progress";
  
    try {
      // Check if the module exists
      const module = await model.modules.findByPk(req.query.id);
      if (!module) {
        return res.status(404).json({ success: false, message: "Module not found" });
      }
  
      // Check if the user is an admin
      if (user.role === "admin") {
        // Admin can update directly without employee-specific validations
        let { completionPercentage } = req.body;
        console.log("completionPercentage", completionPercentage);
        completionPercentage = parseInt(completionPercentage);
        if (completionPercentage !== undefined) {
          if (completionPercentage < 0 || completionPercentage > 100) {
            return res.status(400).json({
              success: false,
              message: "Completion percentage must be between 0 and 100.",
            });
          }
          module.completionPercentage = completionPercentage;
  
          // Set status to "completed" if completionPercentage is 100
          if (completionPercentage === 100) {
            status = "completed";
          }
        }
  
        // Handle file uploads
        if (req.files) {
          const { progressFile, completionFile } = req.files;
  
          // Function to get relative path
          const getRelativePath = (filePath) => filePath.split("public")[1]; // Get the part after "public"
  
          if (progressFile) {
            module.progressFile = getRelativePath(progressFile[0].path);
            console.log("progress file path", module.progressFile);
          }
  
          if (completionFile) {
            if (completionPercentage !== 100) {
              return res.status(400).json({
                success: false,
                message: "Completion file can only be uploaded when completion percentage is 100.",
              });
            }
            module.completionFile = getRelativePath(completionFile[0].path);
            console.log("completion file path", module.completionFile);
          }
        }
  
        module.status = status;
  
        // Save the updates
        await module.save();
  
        return res.status(200).json({
          success: true,
          message: "Module updated successfully",
          data: module,
        });
      }

  
      const employee = await model.employee.findOne({ where: { userId: user.id } });
      const employeeModuleAssignment = await model.employeeModuleAssignment.findOne({
        where: { employeeId: employee.id, moduleId: req.query.id },
      });
  
      if (!employeeModuleAssignment) {
        return res.status(404).json({ success: false, message: "Employee not assigned to module" });
      }
  
      // Validate and update completionPercentage for employee
      const { completionPercentage } = req.body;
  
      if (completionPercentage) {
        if (completionPercentage < 0 || completionPercentage > 100) {
          return res.status(400).json({
            success: false,
            message: "Completion percentage must be between 0 and 100.",
          });
        }
        module.completionPercentage = completionPercentage;
      }
  
      // Handle file uploads for employee
      if (req.files) {
        const { progressFile, completionFile } = req.files;
  
        const getRelativePath = (filePath) => filePath.split("public")[1];
  
        if (progressFile) {
          module.progressFile = getRelativePath(progressFile[0].path);
        }
  
        if (completionFile) {
          if (completionPercentage !== 100) {
            return res.status(400).json({
              success: false,
              message: "Completion file can only be uploaded when completion percentage is 100.",
            });
          }
          status = "completed";
          module.completionFile = getRelativePath(completionFile[0].path);
        }
      }
  
      module.status = status;
  
      // Save the updates
      await module.save();
  
      return res.status(200).json({
        success: true,
        message: "Module progress updated successfully.",
        data: module,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating module progress.",
        error: error.message,
      });
    }
  };
  
