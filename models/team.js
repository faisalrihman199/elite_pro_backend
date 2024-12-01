const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Team = sequelize.define("Team", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
 
}, {
  timestamps: true,
  
});


module.exports = Team;
