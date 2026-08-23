const { Router } = require('express');
const { DISCOTECAS } = require('../discotecas/discotecas');

const router = Router();

router.get('/', (req, res) => {
  res.json({ data: DISCOTECAS });
});

module.exports = router;
