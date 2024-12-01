const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const projectEmployee = sequelize.define("projectEmployee", {
      roleInProject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hoursAllocated: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'on-hold'),
        defaultValue: 'active',
      },
      assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

},
{
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
  }
)

module.exports = projectEmployee;