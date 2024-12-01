const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EmployeeTeam = sequelize.define(
  "teamMembership",
  {
    roleInTeam: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  
  {
    timestamps: true,
  }
);

module.exports = EmployeeTeam;