const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Module = sequelize.define("module", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('not-started', 'in-progress', 'completed', 'on-hold'),
        defaultValue: 'not-started',
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    progressFile:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    completionPercentage:{
        type:DataTypes.STRING,
        allownull:false,
        defaultValue:'0'
    },
    completionFile:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    requirementFile:{
        type:DataTypes.TEXT,
        allowNull:true
    }
}, {
    timestamps: true,
});

module.exports = Module;


