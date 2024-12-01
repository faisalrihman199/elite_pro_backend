const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const groupChat = sequelize.define("groupChat", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})


module.exports = groupChat;