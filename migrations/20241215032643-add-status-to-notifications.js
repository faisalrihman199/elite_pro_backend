"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("notifications", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "send",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("notifications", "status");
  },
};
