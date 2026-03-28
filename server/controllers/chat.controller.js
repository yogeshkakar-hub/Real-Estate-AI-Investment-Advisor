const { db } = require('../db');
const gemini = require('../services/gemini.service');

exports.sendMessage = async (req, res) => {
  const { message, sessionId } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    let sid = sessionId;

    if (!sid) {
      // Create new session
      const title = message.substring(0, 60) + (message.length > 60 ? '...' : '');
      const [newId] = await db('sessions').insert({ user_id: userId, title });
      sid = newId;
    } else {
      // Verify session ownership
      const session = await db('sessions').where({ id: sid, user_id: userId }).first();
      if (!session) return res.status(403).json({ error: 'Session not found or access denied.' });
    }

    // Fetch last 20 messages for context
    const existingMessages = await db('messages')
      .where({ session_id: sid })
      .orderBy('created_at', 'asc')
      .limit(20)
      .select('role', 'content');

    const history = existingMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const aiResponse = await gemini.chat(history, message);

    // Save both messages
    await db('messages').insert({ session_id: sid, role: 'user', content: message });
    await db('messages').insert({ session_id: sid, role: 'model', content: aiResponse });

    // Update session timestamp
    await db('sessions').where({ id: sid }).update({ updated_at: db.fn.now() });

    res.json({ sessionId: sid, response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response. Please try again.' });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await db('sessions')
      .where({ user_id: req.user.id })
      .orderBy('updated_at', 'desc')
      .select('id', 'title', 'created_at', 'updated_at');
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await db('sessions')
      .where({ id: req.params.id, user_id: req.user.id })
      .select('id', 'title', 'created_at')
      .first();

    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const messages = await db('messages')
      .where({ session_id: req.params.id })
      .orderBy('created_at', 'asc')
      .select('id', 'role', 'content', 'created_at');

    res.json({ session, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await db('sessions').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    await db('sessions').where({ id: req.params.id }).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session.' });
  }
};
