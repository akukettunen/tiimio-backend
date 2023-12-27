const { query } = require('./index.js')

// Helper function to get latest messages for a conversation
const getLatestMessages = async (conversationId, limit = 30, index = 0, userId) => {
  const participantCheckSql = `
    SELECT 1
    FROM conversation_participant
    WHERE conversation_id = ? AND user_id = ?;
  `;

  const participantCheckValues = [conversationId, userId];
  const isParticipant = await query(participantCheckSql, participantCheckValues);

  if (isParticipant.length === 0) {
    throw new Error("authentication error");
  }

  const sql = `
    SELECT *
    FROM message
    WHERE object_id = ? 
    ORDER BY sent_datetime DESC
    LIMIT ? OFFSET ?;
  `;
  const values = [conversationId, parseInt(limit), parseInt(index)];

  try {
    const messages = await query(sql, values);
    return messages;
  } catch (error) {
    throw error;
  }
};

// Helper function to get all conversations for a user
const getUserConversations = async (userEmail) => {
  const sql = `
    SELECT c.*
    FROM conversation c
    JOIN conversation_participant cp ON c.id = cp.conversation_id
    WHERE cp.user_id = ?;
  `;
  const values = [userEmail];

  try {
    const conversations = await query(sql, values);
    return conversations;
  } catch (error) {
    throw error;
  }
};

// Helper function to delete a conversation by ID
const deleteConversation = async (conversationId, userEmail) => {
  const sql = `
    DELETE FROM conversation
    WHERE id = ? AND owner = ?;
  `;
  const values = [conversationId, userEmail];

  try {
    const result = await query(sql, values);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Helper function to get all unread messages for a user
const getUnreadMessages = async (userEmail) => {
  const sql = `
    SELECT m.*
    FROM message m
    JOIN message_read_by_user mr ON m.id = mr.message_id
    WHERE mr.user_id = ?;
  `;
  const values = [userEmail];

  try {
    const unreadMessages = await query(sql, values);
    return unreadMessages;
  } catch (error) {
    throw error;
  }
};

const teamIdByConversationId = async id => {
  const sql = `
    SELECT m.team_id
    FROM conversation m
    WHERE id = ?;
  `;
  const values = [ id ];

  try {
    const [ teamId ] = await query(sql, values);
    return teamId;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getLatestMessages,
  getUserConversations,
  deleteConversation,
  getUnreadMessages,
  teamIdByConversationId,
  query
};