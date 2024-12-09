'use strict';
const { Sequelize, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('employees', 'dateOfBirth', {
      type: DataTypes.DATEONLY, // Only date, no time
      allowNull: true, // Make it nullable
      defaultValue: Sequelize.fn('CURDATE'), // Sets default value to current date
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('employees', 'dateOfBirth');
  },
};
