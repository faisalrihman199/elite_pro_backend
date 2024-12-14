const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Employee = require("./employee");

const task = sequelize.define("task", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'pending', 'completed', 'running', 'cancelled'),
        defaultValue: 'active',
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    detailsFile:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    teamlead: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Employee, // References the Employee model
            key: 'id',       // Foreign key column in Employee
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Nullify if the referenced employee is deleted
    },
})


module.exports = task;
