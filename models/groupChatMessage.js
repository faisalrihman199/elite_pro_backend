

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const GroupChatMessages = sequelize.define("groupChatMessages", {
    
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("sent", "delivered", "read"),
      defaultValue: "sent",
    },
  });


module.exports = GroupChatMessages;
  