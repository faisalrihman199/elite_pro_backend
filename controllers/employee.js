const Sequelize = require('sequelize');
const model = require('../models');

exports.getEmployeeInfo = async (req, res) => {
    const user = req.user;

    // If user is an employee, use their employeeId
    let employeeId = req.query.employeeId;
    if (user.role === 'employee') {
        const employee = await model.employee.findOne({ where: { userId: user.id } });
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }
        employeeId = employee.id; // Set employeeId for employees
        console.log("employeeId is ", employeeId);
    }

   
    console.log("employeeId is ", employeeId);

    try {
        // Fetch employee data based on employeeId
        const employee = await model.employee.findOne({
            where: { id: employeeId },
            include: [
                {
                    model: model.team,
                    attributes: ['name'],
                },
            ],
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        // Fetch total modules count for the employee
        const totalModulesCount = await model.modules.count({
            include: [{
                model: model.employee,
                where: { id: employeeId },
            }],
        });

        // Fetch running modules count (completionPercentage < 100 and endDate not exceeded)
        const runningModulesCount = await model.modules.count({
            include: [{
                model: model.employee,
                where: { id: employeeId },
            }],
            where: {
                [Sequelize.Op.or]: [
                    { completionPercentage: { [Sequelize.Op.lt]: 100 } }, // Progress less than 100
                    { completionPercentage: null }, // Completion percentage is null
                ],
                endDate: { [Sequelize.Op.gt]: new Date() }, // End date is not exceeded
            },
        });

        // Fetch pending modules count (completionPercentage is either 0 or null)
        const pendingModulesCount = await model.modules.count({
            include: [{
                model: model.employee,
                where: { id: employeeId },
            }],
            where: {
                [Sequelize.Op.or]: [
                    { completionPercentage: { [Sequelize.Op.eq]: 0 } }, // Progress 0
                    { completionPercentage: null }, // Completion percentage is null
                ],
            },
        });

        // Fetch the running modules (with progress < 100 and end date not exceeded)
        const runningModules = await model.modules.findAll({
            include: [{
                model: model.employee,
                where: { id: employeeId },
            }],
            where: {
                [Sequelize.Op.or]: [
                    { completionPercentage: { [Sequelize.Op.lt]: 100 } }, // Progress less than 100
                    { completionPercentage: null }, // Completion percentage is null
                ],
                endDate: { [Sequelize.Op.gt]: new Date() }, // End date is not exceeded
            },
        });

        return res.status(200).json({
            success: true,
            message: "Employee module counts fetched successfully",
            data: {
                employee,
                totalModulesCount,
                runningModulesCount,
                pendingModulesCount,
                runningModules, // Include the running modules as requested
            },
        });
    } catch (error) {
        console.error("Error fetching module counts:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.getAllEmployeeModulesPaginated = async (req, res) => {
    let { employeeId, page = 1, pageSize = 10 } = req.query;
    const user = req.user; // Get the const user
    try {
        // Ensure employeeId is provided
        if(user.role === 'employee') {
            const employee = await model.employee.findOne({ where: { userId: user.id } });
            if (!employee) {
                return res.status(404).json({ success: false, message: "Employee not found." });
            }
            employeeId = employee.id;
        }

        // Fetch employee data based on employeeId
        const employee = await model.employee.findOne({
            where: { id: employeeId }
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        // Destructure pagination parameters with defaults
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // Fetch all modules for the employee with pagination
        const modules = await model.modules.findAll({
        
            include: [{
                model: model.employee,
                where: { id: employeeId },
                attributes: ["id"] // No need to return employee details in module list
            }],
            offset: offset,
            limit: limit,
            order: [['startDate', 'DESC']] // Optional: order by startDate (most recent first)
        });

        // Count the total number of modules assigned to the employee
        const totalModules = await model.modules.count({
            where: {
                '$employees.id$': employeeId // Ensure the module is assigned to the employee
            },
            include: [{
                model: model.employee,
                where: { id: employeeId }
            }]
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalModules / pageSize);

        // Return paginated modules
        return res.status(200).json({
            success: true,
            message: "Modules fetched successfully.",
            data: {
                modules,
                currentPage: page,
                totalPages,
                totalModules,
                pageSize: limit
            }
        });
    } catch (error) {
        console.error("Error fetching employee modules:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


exports.deleteEmployee = async (req, res) => {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  
    const { oldEmployeeId, newEmployeeId } = req.body;
  
    try {
      // Validate old employee
      const oldEmployee = await model.employee.findOne({ where: { id: oldEmployeeId } });
      if (!oldEmployee) {
        return res.status(404).json({ success: false, message: "Old employee not found." });
      }
  
      // Validate new employee
      const newEmployee = await model.employee.findOne({ where: { id: newEmployeeId } });
      if (!newEmployee) {
        return res.status(404).json({ success: false, message: "New employee not found." });
      }
  
      // Update `employeeId` in employee modules
      await model.employeeModuleAssignment.update(
        { employeeId: newEmployeeId },
        { where: { employeeId: oldEmployeeId } }
      );
  
      // Update `employeeId` in group chat memberships
      await model.groupChatMembership.update(
        { employeeId: newEmployeeId },
        { where: { employeeId: oldEmployeeId } }
      );
  
      // Update `employeeId` in team memberships
      await model.teamMembership.update(
        { employeeId: newEmployeeId },
        { where: { employeeId: oldEmployeeId } }
      );
  
      // Delete the old employee record
      await model.employee.update({status:"inactive"}, { where: { id: oldEmployeeId } }); // Set status to "inactive" instead of "deleted" });
  
      res.status(200).json({
        success: true,
        message: `Employee ${oldEmployeeId} has been successfully deleted, and their assignments have been transferred to employee ${newEmployeeId}.`,
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the employee.",
        error: error.message,
      });
    }
  };
  

  exports.updateEmployee = async (req, res) => {
    const user = req.user;

    // Ensure the user has the correct role
    if (user.role !== 'employee') {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action."
        });
    }

    try {
        // Find the associated user
        const foundUser = await model.user.findOne({ where: { id: user.id } });
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Find the associated employee record
        const employee = await model.employee.findOne({ where: { userId: foundUser.id } });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        // Extract updatable fields from the request body
        const {
            firstName,
            lastName,
            designation,
            department,
            phone,
            address,
            cnic,
            status
        } = req.body;

        // Handle the uploaded profile image (if provided)
        let updatedData = {
            firstName,
            lastName,
            designation,
            department,
            phone,
            address,
            cnic,
            status
        };

        if (req.file) {
            // Get the relative path for the uploaded file
            const filePath = req.file.path; // This is the full path to the uploaded file
            const profileImagePath = path.relative(
                path.join(__dirname, "../public"),
                filePath
            ); // Save the relative path for storage
            updatedData.profile_image = profileImagePath;
        }

        // Update employee details
        await employee.update(updatedData);

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully.",
            data: employee
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the employee.",
            error: error.message
        });
    }
};
