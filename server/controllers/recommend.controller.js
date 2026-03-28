const { db } = require('../db');
const gemini = require('../services/gemini.service');

exports.generate = async (req, res) => {
  const { budget, budgetUnit, city, goal, propertyType, additionalNotes } = req.body;
  const userId = req.user.id;

  if (!budget || !goal || !propertyType) {
    return res.status(400).json({ error: 'Budget, goal, and property type are required.' });
  }

  try {
    const report = await gemini.generateRecommendation({
      budget, budgetUnit, city, goal, propertyType, additionalNotes
    });

    const inputJson = JSON.stringify({ budget, budgetUnit, city, goal, propertyType, additionalNotes });
    const [id] = await db('recommendations').insert({ user_id: userId, input_json: inputJson, report });

    res.json({ id, report });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate recommendation. Please try again.' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const recommendations = await db('recommendations')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .select('id', 'input_json', 'report', 'created_at');

    const parsed = recommendations.map(r => ({
      ...r,
      input: JSON.parse(r.input_json),
    }));

    res.json({ recommendations: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
};
