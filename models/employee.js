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
    }
})

module.exports = Employee;