'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('tasks', 'teamlead', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'employees', // Name of the table for Employee
                key: 'id',          // Primary key column
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL', // Nullify the teamlead column if employee is deleted
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tasks', 'teamlead');
    }
};
