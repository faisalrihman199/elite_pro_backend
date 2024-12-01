const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');
const conversation = require('./conversation');

const Message = sequelize.define('message', {
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    // Disable index creation
    index: false,
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    // Disable index creation
    index: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    defaultValue: 'sent'
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: conversation,
      key: 'id'
    }
  }
}, {
  timestamps: true
});


module.exports = Message;
