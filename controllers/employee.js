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
                attributes: [] // No need to return employee details in module list
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
