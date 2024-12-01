const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Company = sequelize.define("company", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  website:{
    type: DataTypes.STRING,
    allowNull: false,
  }

})

module.exports = Company;