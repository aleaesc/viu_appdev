const { initFirebase } = require('../../lib/firebase');
const { AdminListQueryDTO, validateDTO } = require('../../lib/dto');
const { setCors } = require('../../lib/security');

const ADMIN_USER = 'adminalea';
const ADMIN_PASS = 'alea12345';

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Basic Auth
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const creds = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf8');
    const [user, pass] = creds.split(':');
    if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const query = validateDTO(AdminListQueryDTO, req.query || {});
    const { firestore } = initFirebase();
    const snapshot = await firestore.collection('surveys')
      .orderBy('createdAt', 'desc')
      .limit(query.limit)
      .get();

    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Log admin access
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';
    await firestore.collection('logs').add({
      type: 'admin_list',
      count: items.length,
      ip,
      ua,
      ts: Date.now()
    });

    return res.status(200).json({ items });
  } catch (err) {
    const status = err.status || 500;
    const resp = { error: err.message || 'Server error' };
    if (err.details) resp.details = err.details;
    return res.status(status).json(resp);
  }
};
