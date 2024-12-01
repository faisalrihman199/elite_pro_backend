const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const Project = sequelize.define("project", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    budget:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    requirements:{
        type: DataTypes.TEXT,
        allowNull: false,
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },        
    endDate:{
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    clientName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    clientEmail:{
        type: DataTypes.STRING,
        allowNull: false
    },
    status:{
        type:DataTypes.STRING,
        defaultValue:"active"
    }
   
})

module.exports = Project;