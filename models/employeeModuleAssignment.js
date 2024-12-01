const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const EmployeeModuleAssignment = sequelize.define(
    "employeeModuleAssignment",{
    roleInTask: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    hoursAllocated: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('assigned', 'in-progress', 'completed', 'on-hold'),
        defaultValue: 'assigned',
    },
    assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }}, {
        timestamps: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
    })


module.exports = EmployeeModuleAssignment