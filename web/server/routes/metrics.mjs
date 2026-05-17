import { Router } from 'express';
import { parseApplications } from '../lib/md-parser.mjs';

export function createMetricsRouter(root) {
  const router = Router();

  router.get('/', (_req, res) => {
    try {
      const apps = parseApplications(root);
      const byStatus = {};
      let totalScore = 0, scored = 0, topScore = 0, withPdf = 0, actionable = 0;

      for (const app of apps) {
        const s = normalizeStatus(app.status);
        byStatus[s] = (byStatus[s] || 0) + 1;
        if (app.score > 0) { totalScore += app.score; scored++; if (app.score > topScore) topScore = app.score; }
        if (app.hasPdf) withPdf++;
        if (!['skip', 'rejected', 'discarded'].includes(s)) actionable++;
      }

      // Funnel
      const total = apps.length;
      const applied = (byStatus.applied || 0) + (byStatus.responded || 0) + (byStatus.interview || 0) + (byStatus.offer || 0) + (byStatus.rejected || 0);
      const responded = (byStatus.responded || 0) + (byStatus.interview || 0) + (byStatus.offer || 0);
      const interview = (byStatus.interview || 0) + (byStatus.offer || 0);
      const offer = byStatus.offer || 0;

      const funnel = [
        { label: 'Evaluated', count: total, pct: 100 },
        { label: 'Applied', count: applied, pct: total ? (applied / total * 100) : 0 },
        { label: 'Responded', count: responded, pct: applied ? (responded / applied * 100) : 0 },
        { label: 'Interview', count: interview, pct: applied ? (interview / applied * 100) : 0 },
        { label: 'Offer', count: offer, pct: applied ? (offer / applied * 100) : 0 },
      ];

      // Score buckets
      const buckets = [0, 0, 0, 0, 0];
      for (const app of apps) {
        if (app.score <= 0) continue;
        if (app.score >= 4.5) buckets[0]++;
        else if (app.score >= 4.0) buckets[1]++;
        else if (app.score >= 3.5) buckets[2]++;
        else if (app.score >= 3.0) buckets[3]++;
        else buckets[4]++;
      }
      const scoreBuckets = [
        { label: '4.5-5.0', count: buckets[0] },
        { label: '4.0-4.4', count: buckets[1] },
        { label: '3.5-3.9', count: buckets[2] },
        { label: '3.0-3.4', count: buckets[3] },
        { label: '<3.0', count: buckets[4] },
      ];

      // Weekly activity
      const weekCounts = {};
      for (const app of apps) {
        if (!app.date) continue;
        const d = new Date(app.date + 'T00:00:00');
        if (isNaN(d)) continue;
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
        const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        weekCounts[key] = (weekCounts[key] || 0) + 1;
      }
      const weeklyActivity = Object.entries(weekCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([week, count]) => ({ week, count }));

      res.json({
        total, byStatus, avgScore: scored ? totalScore / scored : 0, topScore, withPdf, actionable,
        funnel, scoreBuckets, weeklyActivity,
        responseRate: applied ? responded / applied * 100 : 0,
        interviewRate: applied ? interview / applied * 100 : 0,
        offerRate: applied ? offer / applied * 100 : 0,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

function normalizeStatus(raw) {
  const s = (raw || '').replace(/\*\*/g, '').trim().toLowerCase();
  if (s.includes('skip') || s.includes('no aplicar')) return 'skip';
  if (s.includes('interview') || s.includes('entrevista')) return 'interview';
  if (s === 'offer' || s.includes('oferta')) return 'offer';
  if (s.includes('responded') || s.includes('respondido')) return 'responded';
  if (s.includes('applied') || s.includes('aplicado') || s === 'enviada') return 'applied';
  if (s.includes('rejected') || s.includes('rechazado')) return 'rejected';
  if (s.includes('discarded') || s.includes('descartado') || s === 'cerrada') return 'discarded';
  if (s.includes('evaluated') || s.includes('evaluada')) return 'evaluated';
  return s;
}
