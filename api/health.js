module.exports = async (req, res) => {
  try {
    const vars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];
    const present = vars.filter(v => !!process.env[v]);
    const missing = vars.filter(v => !process.env[v]);
    res.status(200).json({ status: 'ok', env: { present, missing } });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
};
