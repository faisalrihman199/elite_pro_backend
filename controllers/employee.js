const Sequelize = require('sequelize');
const model = require('../models');
const bcrypt = require('bcrypt');
const {Op} = require('sequelize');

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
                {
                    model:model.user,
                    attributes: ['email'],
                    raw: true,
                }
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
                [Sequelize.Op.and]: [
                    { completionPercentage: { [Sequelize.Op.lt]: 100 } }, // Less than 100
                    { completionPercentage: { [Sequelize.Op.gt]: 0 } },   // Greater than 0
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
                    
                    
                ],
            },
        });

        // Fetch the running modules (with progress < 100 and end date not exceeded)
        const runningModules = await model.modules.findAll({
            include: [{
                model: model.employee,
                where: { id: employeeId },
            },
            {
                model: model.task, // Include the project model
                attributes: ['projectId'], // Fetch only the project name
                include:{
                    model:model.project,
                    attributes: ['name']
                }
            }],
            where: {
                [Sequelize.Op.and]: [
                    { completionPercentage: { [Sequelize.Op.lt]: 100 } }, // Less than 100
                    // { completionPercentage: { [Sequelize.Op.gt]: 0 } },   // Greater than 0
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
    const user = req.user; // Get the current logged-in user
    const employeeId  = req.query.id; // Employee ID from query params (if admin)

    // If the user is admin, get the employeeId from the query, otherwise use the logged-in user's id
    const idToUpdate = user.role === 'admin' && employeeId ? employeeId : user.id;

    // Ensure the user has the correct role for the action
    if (user.role !== 'employee' && user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action."
        });
    }

    try {
        // Find the associated user
        const foundUser = await model.user.findOne({ where: { id: idToUpdate } });
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Check if the new email already exists (if email is being updated)
        let { email, password, firstName, lastName, designation, department, phone, address, cnic, status, dateOfBirth } = req.body;

        if (email && email !== foundUser.email) {
            // Check if the new email is already in use
            const existingUser = await model.user.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already taken by another user."
                });
            }
        }

        // Find the associated employee record
        const employee = await model.employee.findOne({ where: { userId: foundUser.id } });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }

        // Handle password update (if provided)
        let updatedData = {
            firstName,
            lastName,
            designation,
            department,
            phone,
            address,
            cnic,
            status,
            dateOfBirth
        };

        // If password is provided, hash and update it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedData.password = hashedPassword; // Only update password if provided
        }

        // Handle the uploaded profile image (if provided)
        if (req.file) {
            const filePath = req.file.path; // This is the full path to the uploaded file
            const profileImagePath = path.relative(
                path.join(__dirname, "../public"),
                filePath
            ); // Save the relative path for storage
            updatedData.profile_image = profileImagePath;
        }

        // Update user email if it has changed
        if (email && email !== foundUser.email) {
            foundUser.email = email; // Update the email
        }

        // Save the updated user record (only once)
        await foundUser.update(updatedData);

        // Update employee details (if necessary)
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


exports.getContactList = async (req, res) => {
    const user = req.user;

    // Ensure the user is an admin
    if (user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to perform this action.",
        });
    }

    try {
        // Fetch the company associated with the admin
        const company = await model.company.findOne({ where: { userId: user.id } });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found.",
            });
        }

        // Fetch all employees associated with the company
        const employees = await model.employee.findAll({
            where: { companyId: company.id },
            attributes: ['id', 'firstName', 'lastName', 'profile_image', 'userId'],
            include: [
                {
                    model: model.user,
                    attributes: ['email'],
                },
                
            ],
            
        });

        // If no employees found, return a relevant message
        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No employees found in the company.",
            });
        }

        // Modify the employee data to include the name and remove firstName and lastName
        const modifiedEmployees = employees.map(employee => {
            const employeeData = employee.get({ plain: true });
            employeeData.name = `${employeeData.firstName} ${employeeData.lastName}`;
            // Remove firstName and lastName
            delete employeeData.firstName;
            delete employeeData.lastName;
            return employeeData;
        });

        // Return the modified employee data
        return res.status(200).json({
            success: true,
            message: "Contact list fetched successfully.",
            data: modifiedEmployees,
        });

    } catch (error) {
        // Log the error for debugging
        console.error("Error fetching contact list:", error);

        // Return a general error message
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching the contact list.",
            error: error.message,
        });
    }
};

exports.deleteMessage = async (req, res) => {
    const user = req.user;
    const messageId = req.query.id;

    try {
        // Fetch the message to be deleted
        const message = await model.message.findOne({ where: { id: messageId } });
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found." });
        }

        // Fetch the conversation related to the message
        const conversation = await model.conversation.findOne({
            where: {
                [Op.or]: [
                    { user1Id: message.senderId, user2Id: message.receiverId },
                    { user1Id: message.receiverId, user2Id: message.senderId }
                ]
            }
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }

        // If the deleted message is the lastMessageId, we need to update it
        if (conversation.lastMessageId === messageId) {
            // Find the most recent message after the deleted one
            const nextMessage = await model.message.findOne({
                where: {
                    conversationId: conversation.id,
                    createdAt: { [Op.lt]: message.createdAt } // Get messages before the deleted message
                },
                order: [['createdAt', 'DESC']] // Get the most recent one
            });

            // If we found a next message, update lastMessageId to the most recent one
            if (nextMessage) {
                await conversation.update({ lastMessageId: nextMessage.id });
            } else {
                // If there is no next message, set lastMessageId to null or handle as needed
                await conversation.update({ lastMessageId: null });
            }
        }

        // Delete the message
        await message.destroy();

        return res.status(200).json({ success: true, message: "Message deleted successfully" });

    } catch (error) {
        console.error("Error deleting message:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

