const model = require("../models");
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // Import your sequelize instance
const { getSocketConnection } = require('../bin/www');
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

      // Create a new object to hold only the specific otherUser details
      let extendedOtherUser = {
          
          profile_image: otherUser.profile_image,
          userId: otherUser.id,
          lastSeen: otherUser.last_seen,
      };

      // Add the name based on role (admin or employee)
      if (otherUser.role === "admin") {
          // Fetch admin details
          const company = await model.company.findOne({ where: { userId: otherUserId } });
          extendedOtherUser.name = company ? company.name : "Unknown Admin";
          extendedOtherUser.profile_image = null; // Admins have no profile image
          extendedOtherUser.id = company ? company.id : null;
      } else {
          // Fetch employee details
          const employee = await model.employee.findOne({ where: { userId: otherUserId } });
          extendedOtherUser.name = employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee";
          extendedOtherUser.profile_image = employee ? employee.profile_image : null;
          extendedOtherUser.id = employee ? employee.id : null;
      }
  
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
          message: "Conversation details fetched successfully",
          data: {
              conversation,
              messages,
              otherUser: extendedOtherUser,  // Send the extended otherUser object with only the selected attributes
          }
      });
  } catch (error) {
      console.error('Error fetching conversation details:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch conversation details',
      });
  }
};


exports.updateMessageStatus = async (req, res) => {
  let userId = req.user.id;
  let { messageId } = req.body;

  // Validate the incoming request data
  if (!messageId) {
    return res.status(400).json({
      success: false,
      message: "Message ID is required",
    });
  }

  try {
    // Step 1: Find the message by ID
    let message = await model.message.findOne({ where: { id: messageId } });

    // Step 2: If message doesn't exist, return 400
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Step 3: If the message status is already 'read', skip update
    if (message.status === "read") {
      return res.status(200).json({
        success: true,
        message: "Message is already marked as read",
      });
    }

    // Step 4: Update the message status to 'read'
    await model.message.update(
      { status: "read" },
      { where: { id: messageId } }
    );

    // Step 5: Emit to the client (user) that the message status has been updated
    // Assuming a system where all connected WebSocket clients are managed globally,
    // and we broadcast an update to the relevant user.
    // Emit the update through a global event or system.
    emitToUser(userId, {
      action: 'messageStatusUpdated',
      messageId,
      status: 'read',
    });

    // Step 6: Return success response
    res.status(200).json({
      success: true,
      message: "Message status updated successfully",
    });

  } catch (error) {
    // Log the error for debugging
    console.error("Error updating message status:", error);

    // Return a generic error message to the client
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the message status",
      error: error.message,  // Optional: You can choose to log this as well for internal tracking
    });
  }
};

// Emit to the connected WebSocket client (you can implement this function as needed)
function emitToUser(userId, message) {
  // Assuming there's an event system or WebSocket server that listens and emits messages.
  // This could be done using a message broker, socket.io, etc.
  // You would access the connection in your WebSocket handler and broadcast it to the user.
  
  // Example using socket.io (or any WebSocket library you're using):
  console.log("func is ",getSocketConnection)
  const socket = getSocketConnection(userId);  // Get the user's socket connection
  if (socket) {
    socket.emit('messageStatusUpdated', message);  // Emit the message to the client
  } else {
    console.warn(`User ${userId} is not connected`);
  }
}