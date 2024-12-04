const Sequelize = require('sequelize');
const model = require('../models');

exports.getEmployeeInfo = async (req, res) => {
    try {
        const user = req.user;

        // Ensure the user has the 'employee' role
        if (user.role !== "employee") {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Fetch total modules count for the employee
        const totalModulesCount = await model.modules.count({
            include: [{
                model: model.employee,
                where: { id: user.id },
            }],
        });

        // Fetch running modules count (completionPercentage < 100 and endDate not exceeded)
        const runningModulesCount = await model.modules.count({
            include: [{
                model: model.employee,
                where: { id: user.id },
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
                where: { id: user.id },
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
                where: { id: user.id },
            }],
            where: {
                
                endDate: { [Sequelize.Op.gt]: new Date() }, // End date not exceeded
            },
        });

        return res.status(200).json({
            success: true,
            message: "Employee module counts fetched successfully",
            data: {
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
