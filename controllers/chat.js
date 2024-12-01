const model = require("../models");
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // Import your sequelize instance
exports.getConversations = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Step 1: Fetch conversations where the user is a participant
      const conversations = await model.conversation.findAll({
        where: {
          [Op.or]: [
            { user1Id: userId },
            { user2Id: userId },
          ],
        },
      });
  
      // Step 2: Fetch the last message for each conversation based on lastMessageId
      for (let conversation of conversations) {
        if (conversation.lastMessageId) {
          // Fetch the last message based on lastMessageId
          const lastMessage = await model.message.findOne({
            where: { id: conversation.lastMessageId },
          });
  
          console.log('Last message:', lastMessage ? lastMessage.dataValues.message : 'No message found');
  
          // Replace the lastMessageId with the message content in-memory (no need to save in DB if not needed)
          if (lastMessage) {
            conversation.lastMessageId = lastMessage.dataValues.message;
          } else {
            conversation.lastMessageId = null;
          }
        } else {
          // If there's no last message, set it as null
          conversation.lastMessage = null;
        }
      }
  
      // Step 3: Send the conversation data back to the client
      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
      });
    }
  };
  

  exports.getConversationDetails = async (req, res) => {
    try {
      const currentUserId = req.user.id;  // Get the current logged-in user
      const { conversationId } = req.params;  // Get the conversationId from the request params
  
      // Step 1: Fetch the conversation based on the conversationId
      const conversation = await model.conversation.findOne({
        where: { id: conversationId },
      });
  
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }
  
      // Step 2: Identify the other user in the conversation
      let otherUserId;
      if (conversation.user1Id !== currentUserId) {
        otherUserId = conversation.user1Id;
      } else {
        otherUserId = conversation.user2Id;
      }
  
      // Step 3: Fetch the other user's details
      const otherUser = await model.user.findOne({
        where: { id: otherUserId },
      });
  
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'Other user not found',
        });
      }
  
      // Step 4: Fetch all messages in the conversation in ascending order of creation
      const messages = await model.message.findAll({
        where: { conversationId },
        order: [['createdAt', 'ASC']],  // Ascending order by createdAt
      });
  
      // Step 5: Update the message status to 'read' for messages where the current user is the receiver
      await model.message.update(
        { status: 'read' },
        {
          where: {
            receiverId: currentUserId,
            conversationId,
            status: { [Op.ne]: 'read' }, // Only update if the status is not already 'read'
          },
        }
      );
  
      // Step 6: Return the conversation, messages, and other user details
      res.status(200).json({
        success: true,
        conversation,
        messages,
        otherUser,  // Send other user's details
      });
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation details',
      });
    }
  };
  


  