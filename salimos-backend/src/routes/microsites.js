const { Router } = require('express');
const https = require('https');
const config = require('../config');

const router = Router();

function fetchFromFourvenues(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.fourvenues.host,
      port: 443,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.fourvenues.token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

router.get('/:slug/metadata', async (req, res) => {
  try {
    const { statusCode, body } = await fetchFromFourvenues(
      `/api/microsites/${req.params.slug}/metadata`
    );
    res.status(statusCode).type('application/json; charset=utf-8').send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
