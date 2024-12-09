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

      // Step 2: Process each conversation
      const processedConversations = [];
      for (let conversation of conversations) {
          conversation = conversation.get({ plain: true }); // Convert Sequelize object to plain object
          
          // Fetch the last message
          if (conversation.lastMessageId) {
              const lastMessage = await model.message.findOne({
                  where: { id: conversation.lastMessageId },
              });
              conversation.lastMessage = lastMessage ? lastMessage.message : null;
          } else {
              conversation.lastMessage = null;
          }

          // Identify the "other" user in the conversation
          const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

          // Fetch the other user's details
          const otherUser = await model.user.findOne({
              where: { id: otherUserId },
          });

          if (otherUser) {
              if (otherUser.role === "admin") {
                  // Fetch admin details
                  const company = await model.company.findOne({ where: { userId: otherUserId } });
                  conversation.otherUser = {
                      name: company ? company.name : "Unknown Admin",
                      profile_image: null, // Admins have no profile image
                  };
              } else {
                  // Fetch employee details
                  const employee = await model.employee.findOne({ where: { userId: otherUserId } });
                  conversation.otherUser = {
                      name: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee",
                      profile_image: employee ? employee.profile_image : null,
                  };
              }
          } else {
              conversation.otherUser = {
                  name: "Unknown User",
                  profile_image: null,
              };
          }

          // Add the processed conversation to the list
          processedConversations.push(conversation);
      }

      // Step 3: Send the processed conversation data back to the client
      res.status(200).json({
          success: true,
          data: processedConversations,
      });
  } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch conversations',
          error: error.message,
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
  


  