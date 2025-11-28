const { initFirebase } = require('../lib/firebase');
const { SurveyDTO, validateDTO } = require('../lib/dto');
const { rateLimit, setCors } = require('../lib/security');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();

    rateLimit(req);

    const body = req.body || (req.headers['content-type']?.includes('application/json') ? await readJson(req) : {});
    const payload = validateDTO(SurveyDTO, { ...body, createdAt: Date.now() });

    const { firestore } = initFirebase();
    const docRef = await firestore.collection('surveys').add(payload);

    return res.status(201).json({ id: docRef.id });
  } catch (err) {
    const status = err.status || 500;
    const resp = { error: err.message || 'Server error' };
    if (err.details) resp.details = err.details;
    return res.status(status).json(resp);
  }
};

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
