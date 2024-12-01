const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const User = sequelize.define("user", {
    
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        
    },
    last_seen: {
        type: DataTypes.STRING,
        allowNull: true,
    },

},{
   paranoid: true
})

module.exports = User;