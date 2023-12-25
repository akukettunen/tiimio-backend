require('dotenv').config()
const express = require('express');
const { user, is_in_team } = require('../middleware/authMiddleware');
      router = express.Router()
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      require('express-async-errors');
      const { getLatestMessages, getUserConversations, deleteConversation, getUnreadMessages, query } = require('../utils/db/chat.js');

// GET latest messages for a conversation
router.get('/conversation/:id/messages', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const limit = req.query.limit || 30;
    const index = req.query.index || 0;
    const user_id = req.tiimio_user.email

    const messages = await getLatestMessages(conversationId, limit, index, user_id);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all conversations for the user
router.get('/conversation', user, async (req, res) => {
  try {
    const userConversations = await getUserConversations(req.tiimio_user.email);
    res.json(userConversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE conversation by ID
router.delete('/conversation/:id', user, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const isDeleted = await deleteConversation(conversationId, req.tiimio_user.email);

    if (isDeleted) {
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Permission denied or conversation not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET all unread messages for the user
router.get('/message/unread', user, async (req, res) => {
  try {
    const unreadMessages = await getUnreadMessages(req.tiimio_user.email);
    res.json(unreadMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST a message to a conversation
router.post('/conversation/:id/messages', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message_type, text, object_id } = req.body; // Assuming you send message_type, text, and object_id in the request body
    const sentDatetime = new Date();
    const sender = req.tiimio_user.email;

    // Validate message_type
    if (message_type !== 'text') {
      // Validate object_id for non-"text" messages
      if (object_id === undefined) {
        return res.status(400).json({ error: 'For non-"text" messages, object_id must be defined.' });
      }
    } else {
      // Validate text for "text" messages
      if (text === undefined) {
        return res.status(400).json({ error: 'For "text" messages, text must be defined.' });
      }
    }

    // Perform the insertion into the database
    const sql = `
      INSERT INTO message (message_type, text, sent_datetime, sender, object_id, conversation_id)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [message_type, text || null, sentDatetime, sender, object_id || null, conversationId];

    await query(sql, values);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET messages within a certain timeframe for a conversation (polling)
router.get('/conversation/:id/messages/poll', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const seconds = req.query.seconds || 5; // Default to 5 seconds
    const startTime = new Date(new Date().getTime() - seconds * 1000); // Calculate start time

    const sql = `
      SELECT *
      FROM message
      WHERE object_id = ? AND sent_datetime >= ?;
    `;
    const values = [conversationId, startTime];

    const messages = await query(sql, values);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST a message to a conversation
router.post('/conversation/:id/messages', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message_type, text, object_id } = req.body; // Assuming you send message_type, text, and object_id in the request body
    const sentDatetime = new Date();
    const sender = req.tiimio_user.email;

    // Validate message_type
    if (message_type !== 'text') {
      // Validate object_id for non-"text" messages
      if (object_id === undefined) {
        return res.status(400).json({ error: 'For non-"text" messages, object_id must be defined.' });
      }
    } else {
      // Validate text for "text" messages
      if (text === undefined) {
        return res.status(400).json({ error: 'For "text" messages, text must be defined.' });
      }
    }

    // Perform the insertion into the database
    const sql = `
      INSERT INTO message (message_type, text, sent_datetime, sender, object_id, conversation_id)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [message_type, text || null, sentDatetime, sender, object_id || null, conversationId];

    await query(sql, values);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST add user to conversation
router.post('/conversation/:id/user', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userEmail = req.tiimio_user.email;

    // Check if the user is already a participant in the conversation
    const checkParticipantQuery = `
      SELECT 1
      FROM conversation_participant
      WHERE conversation_id = ? AND user_id = ?;
    `;
    const checkParticipantValues = [conversationId, userEmail];
    const participantExists = await query(checkParticipantQuery, checkParticipantValues);

    if (participantExists.length > 0) {
      return res.status(400).json({ error: 'User is already a participant in the conversation.' });
    }

    // Add user to the conversation
    const addUserQuery = `
      INSERT INTO conversation_participant (conversation_id, user_id)
      VALUES (?, ?);
    `;
    const addUserValues = [conversationId, userEmail];
    await query(addUserQuery, addUserValues);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT update read receipt
router.put('/message/:id/read', user, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userEmail = req.tiimio_user.email;

    // Update read receipt for the user and message
    const updateReadReceiptQuery = `
      INSERT INTO message_read_by_user (message_id, user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE read_datetime = NOW();
    `;
    const updateReadReceiptValues = [messageId, userEmail];
    await query(updateReadReceiptQuery, updateReadReceiptValues);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST add users to conversation in batch
router.post('/conversation/:id/users/batch', user, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { user_emails } = req.body; // Assuming you send user_emails in the request body

    // Check if users are already participants in the conversation
    const checkParticipantsQuery = `
      SELECT user_id
      FROM conversation_participant
      WHERE conversation_id = ? AND user_id IN (?);
    `;
    const checkParticipantsValues = [conversationId, user_emails];
    const existingParticipants = await query(checkParticipantsQuery, checkParticipantsValues);

    if (existingParticipants.length > 0) {
      return res.status(400).json({ error: 'One or more users are already participants in the conversation.' });
    }

    // Add users to the conversation in batch
    const addUsersQuery = `
      INSERT INTO conversation_participant (conversation_id, user_id)
      VALUES ${user_emails.map(() => '(?, ?)').join(', ')};
    `;
    const addUsersValues = user_emails.reduce((acc, userEmail) => [...acc, conversationId, userEmail], []);
    await query(addUsersQuery, addUsersValues);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;