import fs from 'fs';
import path from 'path';

/**
 * Parse applications.md table into structured array.
 * Compatible with the Go dashboard parser format.
 */
export function parseApplications(careerOpsRoot) {
  let filePath = path.join(careerOpsRoot, 'data', 'applications.md');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(careerOpsRoot, 'applications.md');
    if (!fs.existsSync(filePath)) return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const apps = [];
  const reScore = /(\d+\.?\d*)\/5/;
  const reReport = /\[(\d+)\]\(([^)]+)\)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.startsWith('| #') || trimmed.startsWith('|---')) continue;

    let fields;
    if (trimmed.includes('\t')) {
      fields = trimmed.replace(/^\|/, '').trim().split('\t').map(f => f.replace(/^\||\|$/g, '').trim());
    } else {
      fields = trimmed.replace(/^\||\|$/g, '').split('|').map(f => f.trim());
    }

    if (fields.length < 8) continue;

    const app = {
      number: parseInt(fields[0]) || apps.length + 1,
      date: fields[1],
      company: fields[2],
      role: fields[3],
      scoreRaw: fields[4],
      score: 0,
      status: fields[5],
      hasPdf: fields[6].includes('✅'),
      reportPath: '',
      reportNumber: '',
      notes: fields.length > 8 ? fields[8] : '',
    };

    const sm = reScore.exec(fields[4]);
    if (sm) app.score = parseFloat(sm[1]);

    const rm = reReport.exec(fields[7]);
    if (rm) {
      app.reportNumber = rm[1];
      app.reportPath = rm[2];
    }

    apps.push(app);
  }

  // Load pipeline URLs as fallback
  const pipelineUrls = {};
  try {
    const pipeContent = fs.readFileSync(path.join(careerOpsRoot, 'data', 'pipeline.md'), 'utf-8');
    for (const line of pipeContent.split('\n')) {
      const match = line.match(/^-\s*\[[x ]\]\s*(https?:\/\/\S+)\s*\|\s*([^|]+)\s*\|(.*)/i);
      if (match) {
        pipelineUrls[match[2].trim().toLowerCase()] = match[1];
      }
    }
  } catch { /* ignore */ }

  // Enrich with report data and pipeline fallbacks
  for (const app of apps) {
    if (pipelineUrls[app.company.toLowerCase()]) {
      app.jobUrl = pipelineUrls[app.company.toLowerCase()];
    }

    if (!app.reportPath) continue;
    try {
      const reportFile = path.join(careerOpsRoot, app.reportPath);
      const reportContent = fs.readFileSync(reportFile, 'utf-8').slice(0, 1500);
      
      const urlMatch = reportContent.match(/^\*\*URL:\*\*\s*(https?:\/\/\S+)/m);
      if (urlMatch && !app.jobUrl) app.jobUrl = urlMatch[1];
      
      const archMatch = reportContent.match(/\*\*Arquetipo(?:\s+detectado)?\*\*\s*\|\s*(.+)/i) 
        || reportContent.match(/\*\*Archetype(?:\s+detected)?\*\*\s*\|\s*(.+)/i);
      if (archMatch) app.archetype = archMatch[1].replace(/\|/g, '').trim();
      
      const tldrMatch = reportContent.match(/\*\*TL;DR\*\*\s*\|\s*(.+)/i)
        || reportContent.match(/\*\*TL;DR:\*\*\s*(.+)/i);
      if (tldrMatch) app.tldr = tldrMatch[1].replace(/\|/g, '').trim().slice(0, 120);

      const remoteMatch = reportContent.match(/\*\*Remote\*\*\s*\|\s*(.+)/i);
      if (remoteMatch) app.remote = remoteMatch[1].replace(/\|/g, '').trim();

      const compMatch = reportContent.match(/\*\*Comp\*\*\s*\|\s*(.+)/i)
        || reportContent.match(/\*\*Compensation\*\*\s*\|\s*(.+)/i);
      if (compMatch) app.comp = compMatch[1].replace(/\|/g, '').trim();

      const legMatch = reportContent.match(/\*\*Legitimacy:\*\*\s*(.+)/i)
        || reportContent.match(/\*\*Legitimidad:\*\*\s*(.+)/i);
      if (legMatch) app.legitimacy = legMatch[1].trim();
    } catch { /* report file not found — skip enrichment */ }
  }

  // Load scan-history URLs as secondary fallback
  try {
    const scanPath = path.join(careerOpsRoot, 'data', 'scan-history.tsv');
    if (fs.existsSync(scanPath)) {
      const scanData = fs.readFileSync(scanPath, 'utf-8').split('\n');
      for (const app of apps) {
        if (app.jobUrl) continue;
        for (const line of scanData) {
          const fields = line.split('\t');
          if (fields.length > 4 && fields[0].startsWith('http') && fields[4].toLowerCase().includes(app.company.toLowerCase())) {
            app.jobUrl = fields[0];
            break;
          }
        }
      }
    }
  } catch { /* ignore */ }

  return apps;
}

/**
 * Update a single application's status in applications.md
 */
export function updateApplicationStatus(careerOpsRoot, reportNumber, newStatus) {
  let filePath = path.join(careerOpsRoot, 'data', 'applications.md');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(careerOpsRoot, 'applications.md');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`[${reportNumber}]`)) {
      // Find the status field (field 5, 0-indexed) and replace it
      const parts = lines[i].replace(/^\||\|$/g, '').split('|');
      if (parts.length >= 6) {
        parts[5] = ` ${newStatus} `;
        lines[i] = '|' + parts.join('|') + '|';
        found = true;
        break;
      }
    }
  }

  if (!found) throw new Error(`Application with report ${reportNumber} not found`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}
