'use strict';
const { Sequelize, DataTypes } = require('sequelize');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding the dateOfBirth column to the employee table with the default value as current date
    await queryInterface.addColumn('employees', 'dateOfBirth', {
      type: DataTypes.DATEONLY, // Only date, no time
      allowNull: false, // Set to false, making it a required field
      defaultValue: Sequelize.NOW, // Sets default value to the current date
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes if needed (removing dateOfBirth)
    await queryInterface.removeColumn('employees', 'dateOfBirth');
  },
};
