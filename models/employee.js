const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const Employee = sequelize.define("employee", {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    designation:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    department:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    address:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    cnic:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    profile_image:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    status:{
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY, // Use DATEONLY for storing only the date (no time part)
        allowNull: false,
    }
})

module.exports = Employee;