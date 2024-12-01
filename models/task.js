const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

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
    }
})


module.exports = task;
