const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const groupChatMembership = sequelize.define("groupChatMembership", {})


module.exports = groupChatMembership;