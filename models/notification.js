const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");


const Notification = sequelize.define("notification", {
    notificationType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    status:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "send",
    }

})

module.exports = Notification
