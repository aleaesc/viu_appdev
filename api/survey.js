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
    const batch = firestore.batch();
    const surveysCol = firestore.collection('surveys');
    const usersCol = firestore.collection('users');
    const logsCol = firestore.collection('logs');

    const surveyRef = surveysCol.doc();
    batch.set(surveyRef, payload);

    // Upsert minimal user profile if email provided
    if (payload.email) {
      const userRef = usersCol.doc(payload.email);
      batch.set(userRef, {
        email: payload.email,
        lastCountry: payload.country || payload.location || null,
        lastService: payload.service || null,
        updatedAt: Date.now()
      }, { merge: true });
    }

    // Log submission
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    const logRef = logsCol.doc();
    batch.set(logRef, {
      type: 'survey_submit',
      surveyId: surveyRef.id,
      email: payload.email || null,
      ip,
      ua,
      ts: Date.now()
    });

    await batch.commit();

    return res.status(201).json({ id: surveyRef.id });
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
