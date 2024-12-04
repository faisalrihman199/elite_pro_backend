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
    // Ensure the user is an employee
    if (user.role !== "employee") {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const employee = await model.employee.findOne({ where: { userId: user.id } });
    console.log("employee is ", employee.id, req.query.id);
    const employeeModuleAssignment = await model.employeeModuleAssignment.findOne({
        where: { employeeId: employee.id, moduleId: req.query.id },
    })

    if (!employeeModuleAssignment) {
        return res.status(404).json({ success: false, message: "Employee not assigned to module" });
    }

     
    try {
        // Find the module
        const module = await model.modules.findByPk(req.query.id);
        if (!module) {
            return res.status(404).json({ success: false, message: "Module not found" });
        }



        // Validate and update completionPercentage
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

        // Handle file uploads
        if (req.files) {
            const { progressFile, completionFile } = req.files;

            // Function to get relative path
            const getRelativePath = (filePath) => {
                return filePath.split("public")[1]; // Get the part after "public"
            };

            // Update progressFile if provided
            if (progressFile) {
                module.progressFile = getRelativePath(progressFile[0].path); 
            }

            // Only allow completionFile if completionPercentage is 100
            if (completionFile) {
                if (completionPercentage !== "100") {
                    console.log("percentage is ", completionPercentage);
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
            data:module,
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
