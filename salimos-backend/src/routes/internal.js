const { Router } = require('express');
const { runSweep } = require('../jobs/sweepEventos');

const router = Router();

/**
 * Dispara el barrido semanal de eventos por HTTP, para que lo llame un cron
 * externo gratuito (GitHub Actions) en vez de un Render Cron Job (que exige
 * tarjeta en el plan gratuito). Protegido con un secreto compartido — nunca
 * expuesto a la app ni a clientes públicos.
 */
router.post('/sweep', async (req, res) => {
  const secret = process.env.SWEEP_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'SWEEP_SECRET no configurado en el backend' });
    return;
  }

  const header = req.get('authorization') ?? '';
  if (header !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const resumen = await runSweep();
    const fallos = resumen.filter((r) => !r.ok).length;
    res.status(fallos > 0 && fallos === resumen.length ? 502 : 200).json({ resumen });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
