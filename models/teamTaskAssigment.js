const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TeamTask = sequelize.define(
  "TeamTaskAssignment",
  {
    roleInProject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "on-hold"),
      defaultValue: "active",
    },
  },
  {
    timestamps: true,
    updatedAt: "updatedAt",
    createdAt: "createdAt",
  }
);

module.exports = TeamTask;
