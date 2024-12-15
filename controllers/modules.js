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
      const module = await model.modules.findByPk(req.query.id, {
          include: [{ model: model.task, include: [{ model: model.project }] }]
      });

      if (!module) {
          return res.status(404).json({ success: false, message: "Module not found" });
      }

      // Check if the user is an admin
      if (user.role === "admin") {
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
              console.log("progressFile", progressFile);
                console.log("completionFile", completionFile);

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

          // Save the updates to module
          await module.save();

          // Calculate Task Progress based on the completionPercentage of all modules in the task
          const task = module.task;
          const taskModules = await model.modules.findAll({ where: { taskId: task.id } });

          let totalTaskProgress = 0;
          let totalModules = taskModules.length;
          console.log("totalModules", totalModules);

          taskModules.forEach((taskModule) => {
              console.log("taskModule.completionPercentage", taskModule.completionPercentage);

              totalTaskProgress += parseInt(taskModule.completionPercentage);
          });

          const taskProgress = Math.round(totalTaskProgress / totalModules);
          console.log("taskProgress", taskProgress);

          // Update task status
          if (taskProgress === 100) {
              task.status = "completed";
          } else {
              task.status = "active";
          }

          await task.save();

          // Calculate Project Progress based on the completionPercentage of all tasks in the project
          const project = task.project;
          const projectTasks = await model.task.findAll({ where: { projectId: project.id } });

          let totalProjectProgress = 0;
          let totalTasks = projectTasks.length;

          // Calculate the progress for each task in the project
          for (let task of projectTasks) {
              // Calculate the completion percentage of the task by averaging the completionPercentage of all its modules
              const taskModules = await model.modules.findAll({ where: { taskId: task.id } });
              let totalTaskProgress = 0;
              let totalTaskModules = taskModules.length;

              taskModules.forEach((taskModule) => {
                  totalTaskProgress += parseInt(taskModule.completionPercentage); // Sum completion of each module
              });

              const taskProgress = totalTaskModules ? Math.round(totalTaskProgress / totalTaskModules) : 0; // Average completion of task
              totalProjectProgress += taskProgress; // Add task's completion to total project progress
          }

          const projectProgress = Math.round(totalProjectProgress / totalTasks); // Average project completion

          // Update project's completion percentage
          project.completionPercentage = projectProgress;
          console.log("projectProgress", projectProgress);

          // Update project status based on completion percentage
          if (projectProgress === 100) {
              project.status = "completed";
          } else {
              project.status = "active";
          }

          await project.save();

          return res.status(200).json({
              success: true,
              message: "Module, Task, and Project updated successfully",
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

      // Save the updates to module
      await module.save();

      // Calculate Task Progress based on the completionPercentage of all modules in the task
      const task = module.task;
      const taskModules = await model.modules.findAll({ where: { taskId: task.id } });

      let totalTaskProgress = 0;
      let totalModules = taskModules.length;

      taskModules.forEach((taskModule) => {
          totalTaskProgress += taskModule.completionPercentage;
      });

      const taskProgress = Math.round(totalTaskProgress / totalModules);

      // Update task status
      if (taskProgress === 100) {
          task.status = "completed";
      } else {
          task.status = "active";
      }

      await task.save();

      // Calculate Project Progress based on the completionPercentage of all tasks in the project
      const project = task.project;
      const projectTasks = await model.task.findAll({ where: { projectId: project.id } });

      let totalProjectProgress = 0;
      let totalTasks = projectTasks.length;

      projectTasks.forEach((task) => {
          totalProjectProgress += parseInt(task.completionPercentage);
      });

      const projectProgress = Math.round(totalProjectProgress / totalTasks);

      // Update project status
      if (projectProgress === 100) {
          project.status = "completed";
      } else {
          project.status = "active";
      }

      await project.save();

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


exports.deleteModule = async (req, res) => {
    const user = req.user;

    // Check if the user is an admin
    if (user.role !== "admin") {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.query;

    // Check if the 'id' query parameter is provided
    if (!id) {
        return res.status(400).json({ success: false, message: "Module ID is required" });
    }

    try {
        // Find the module to delete
        const module = await model.modules.findOne({ where: { id } });

        // If the module is not found, return a 404 error
        if (!module) {
            return res.status(404).json({ success: false, message: "Module not found" });
        }

        // // Delete any assignments related to this module
        // await model.employeeModuleAssignment.destroy({ where: { moduleId: module.id } });

        // Delete the module itself
        await module.destroy();

        // Return a success message
        return res.status(200).json({ success: true, message: "Module deleted successfully" });
    } catch (error) {
        // Log the error and return a generic server error response
        console.error("Error deleting module:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
