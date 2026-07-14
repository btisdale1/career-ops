import fs from 'fs';
import { resolve } from 'path';

const markdownPath = process.argv[2];
const templatePath = 'templates/cv-template.html';
const outputPath = markdownPath.replace('.md', '.html');

if (!markdownPath) {
  console.error('Usage: node prepare-cv-html.mjs <input.md>');
  process.exit(1);
}

const md = fs.readFileSync(markdownPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');

// Simple markdown parser for the specific CV structure
const sections = {};
let currentSection = '';
const lines = md.split('\n');

for (const line of lines) {
  if (line.startsWith('# ')) {
    sections['NAME'] = line.replace('# ', '').trim();
  } else if (line.startsWith('## ')) {
    currentSection = line.replace('## ', '').trim().toUpperCase();
    sections[currentSection] = [];
  } else if (currentSection) {
    sections[currentSection].push(line);
  }
}

// Map sections to template placeholders
const profile = {
  NAME: "Bryan Tisdale",
  PHONE: "210 838 6467",
  EMAIL: "btisdale@gmail.com",
  LINKEDIN_URL: "https://linkedin.com/in/bryan-tisdale",
  LINKEDIN_DISPLAY: "linkedin.com/in/bryan-tisdale",
  PORTFOLIO_URL: "",
  PORTFOLIO_DISPLAY: "",
  LOCATION: "San Antonio, TX",
  LANG: "en",
  PAGE_WIDTH: "800px"
};

const replacements = {
  ...profile,
  SECTION_SUMMARY: "Professional Summary",
  SECTION_COMPETENCIES: "Core Competencies",
  SECTION_EXPERIENCE: "Work Experience",
  SECTION_PROJECTS: "Key Projects",
  SECTION_EDUCATION: "Education",
  SECTION_CERTIFICATIONS: "Certifications",
  SECTION_SKILLS: "Technical Skills",
  SUMMARY_TEXT: (sections['SUMMARY'] || sections['PROFESSIONAL SUMMARY'] || []).join(' ').trim(),
  COMPETENCIES: formatCompetencies(sections['COMPETENCIES'] || sections['CORE COMPETENCIES'] || []),
  EXPERIENCE: formatExperience(sections['WORK EXPERIENCE'] || []),
  PROJECTS: "", // Will fill if needed
  EDUCATION: formatEducation(sections['EDUCATION'] || []),
  CERTIFICATIONS: "", // Will fill if needed
  SKILLS: formatSkills(sections['SKILLS'] || [])
};

function formatExperience(lines) {
  let html = '';
  let currentJob = null;

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (currentJob) html += renderJob(currentJob);
      const [company, period] = line.replace('### ', '').split(' | ');
      currentJob = { company, period, roles: [] };
    } else if (line.startsWith('**')) {
      const role = line.replace(/\*\*/g, '').trim();
      currentJob.roles.push({ role, bullets: [] });
    } else if (line.startsWith('* ')) {
      const bullet = line.replace('* ', '').trim();
      if (currentJob.roles.length === 0) {
          currentJob.roles.push({ role: '', bullets: [] });
      }
      currentJob.roles[currentJob.roles.length - 1].bullets.push(bullet);
    }
  }
  if (currentJob) html += renderJob(currentJob);
  return html;
}

function formatProjects(lines) {
  let html = '';
  const text = lines.join('\n').trim();
  if (!text) return '';
  // Simple pass-through for now or more complex logic if needed
  return text;
}

function formatCertifications(lines) {
  let html = '';
  const text = lines.join('\n').trim();
  if (!text) return '';
  return text;
}

function formatCompetencies(lines) {
  let html = '';
  const text = lines.join(' ').trim();
  if (!text) return '';
  
  const items = text.split(/[•·|]|\s{2,}/).map(i => i.trim()).filter(Boolean);
  for (const item of items) {
    html += `<div class="competency-tag">${item}</div>`;
  }
  return html;
}

function renderJob(job) {
  let rolesHtml = '';
  for (const r of job.roles) {
    rolesHtml += `
      <div class="job-role">${r.role}</div>
      <ul>
        ${r.bullets.map(b => `<li>${b}</li>`).join('')}
      </ul>
    `;
  }

  return `
    <div class="job">
      <div class="job-header">
        <span class="job-company">${job.company}</span>
        <span class="job-period">${job.period || ''}</span>
      </div>
      ${rolesHtml}
    </div>
  `;
}

function formatEducation(lines) {
  let html = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('**')) {
      const title = line.replace(/\*\*/g, '');
      const org = lines[i+1] ? lines[i+1].trim() : '';
      html += `
        <div class="edu-item">
          <div class="edu-header">
            <span class="edu-title">${title}</span>
          </div>
          <div class="edu-org">${org}</div>
        </div>
      `;
      i++;
    }
  }
  return html;
}

function formatSkills(lines) {
  let html = '<div class="skills-grid">';
  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    if (cleanLine.includes('**')) {
        const [cat, items] = cleanLine.split(':');
        html += `<div class="skill-item"><span class="skill-category">${cat.replace(/\*\*/g, '')}:</span> ${items}</div>`;
    } else {
        html += `<div class="skill-item">${cleanLine}</div>`;
    }
  }
  html += '</div>';
  return html;
}

let finalHtml = template;

// Map actual formatted values
const contentReplacements = {
  SUMMARY_TEXT: (sections['SUMMARY'] || sections['PROFESSIONAL SUMMARY'] || []).join('\n').trim(),
  COMPETENCIES: formatCompetencies(sections['COMPETENCIES'] || sections['CORE COMPETENCIES'] || []),
  EXPERIENCE: formatExperience(sections['WORK EXPERIENCE'] || []),
  PROJECTS: formatProjects(sections['PROJECTS'] || sections['KEY PROJECTS'] || []),
  EDUCATION: formatEducation(sections['EDUCATION'] || []),
  CERTIFICATIONS: formatCertifications(sections['CERTIFICATIONS'] || []),
  SKILLS: formatSkills(sections['SKILLS'] || [])
};

// Debug: Check lengths of content
for (const [key, value] of Object.entries(contentReplacements)) {
  console.log(`Debug: Section ${key} content length: ${value.length}`);
}

// Helper to remove empty sections from the template using comment markers
function removeEmptySection(html, sectionName, value) {
  if (!value || value.trim() === '' || value === '<div class="skills-grid"></div>') {
    // Match from the comment marker to just before the next comment marker or end of body
    const regex = new RegExp(`<!--\\s*${sectionName}\\s*-->[^]*?(?=<!--|</body>|$)`, 'g');
    return html.replace(regex, '');
  }
  return html;
}

const sectionMarkers = {
  SUMMARY_TEXT: 'PROFESSIONAL SUMMARY',
  COMPETENCIES: 'CORE COMPETENCIES',
  EXPERIENCE: 'WORK EXPERIENCE',
  PROJECTS: 'PROJECTS',
  EDUCATION: 'EDUCATION',
  CERTIFICATIONS: 'CERTIFICATIONS',
  SKILLS: 'SKILLS'
};

// Remove empty sections BEFORE replacing anything
for (const [key, value] of Object.entries(contentReplacements)) {
  const marker = sectionMarkers[key];
  if (marker) {
    finalHtml = removeEmptySection(finalHtml, marker, value);
  }
}

// Now do all replacements
const allReplacements = { ...replacements, ...contentReplacements };
for (const [key, value] of Object.entries(allReplacements)) {
  finalHtml = finalHtml.replaceAll(`{{${key}}}`, value);
}

fs.writeFileSync(outputPath, finalHtml);
console.log(`✅ HTML generated: ${outputPath}`);
