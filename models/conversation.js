const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');
const Message = require('./message'); // Include the Message model

const Conversation = sequelize.define('conversation', {
  user1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    index: false,
  },
  user2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    index: false,
  },
  lastMessageId: {
    type: DataTypes.INTEGER,
    
  }
}, {
  timestamps: true
});


module.exports = Conversation;
