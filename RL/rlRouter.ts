import { Router, Request, Response } from 'express';
import { rlReset, rlStep } from './rlEnv';

export function createRlRouter(): Router {
  const router = Router();

  router.post('/reset', (req: Request, res: Response) => {
    try {
      const result = rlReset(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'rlResetFailed' });
    }
  });

  router.post('/step', async (req: Request, res: Response) => {
    try {
      const result = await rlStep(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'rlStepFailed' });
    }
  });

  return router;
}
