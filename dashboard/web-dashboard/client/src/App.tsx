import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Application {
  id: string; date: string; company: string; role: string; score: string; status: string; pdf: string; report: string; notes: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'commands' | 'settings'>('pipeline');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Application | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [cv, setCv] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/api/applications').then(res => res.json()).then(data => {
      if (!data?.content) return;
      const lines = data.content.split('\n');
      setApplications(lines.slice(4).filter((row: string) => row.includes('|')).map((row: string) => {
        const cols = row.split('|').map((col) => col.trim());
        const reportMatch = cols[8]?.match(/\((reports\/[^)]+)\)/);
        return { 
          id: cols[1] || '', date: cols[2] || '', company: cols[3] || '', role: cols[4] || '', 
          score: cols[5] || '', status: cols[6] || '', pdf: cols[7] || '', 
          report: reportMatch ? reportMatch[1] : '', notes: cols[9] || '' 
        };
      }));
    });
    fetch('http://localhost:3001/api/profile').then(res => res.json()).then(data => setProfile(data.content));
    fetch('http://localhost:3001/api/cv').then(res => res.json()).then(data => setCv(data.content));
  }, []);

  const runCommand = (command: string, args: string = '') => {
    fetch('http://localhost:3001/api/command', { 
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ command, args }) 
    }).then(res => res.json()).then(data => alert(data.output));
  };

  const openJobDetail = (app: Application) => {
    if (app.report) {
      const filename = app.report.replace('reports/', '');
      fetch(`http://localhost:3001/api/reports/${filename}`).then(res => res.json()).then(data => { 
        const content = data.content;
        const headerLines = content.split('\n').filter((l: string) => l.includes(':') && !l.startsWith('#'));
        const headerData = headerLines.reduce((acc: any, line: string) => {
            const [key, ...val] = line.split(':');
            acc[key.trim().toLowerCase()] = val.join(':').trim();
            return acc;
        }, {});
        setReportContent(content); 
        setSelectedJob({ ...app, ...headerData }); 
      });
    } else {
      setSelectedJob(app);
      setReportContent('No evaluation report found for this role.');
    }
  };

  const runScan = () => {
    setIsScanning(true);
    fetch('http://localhost:3001/api/scan', { method: 'POST' }).then(() => { alert('Scan completed!'); setIsScanning(false); });
  };

  const saveProfile = () => {
    fetch('http://localhost:3001/api/profile', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(profile) }).then(() => alert('Profile saved!'));
  };

  const saveCV = () => {
    fetch('http://localhost:3001/api/cv', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ content: cv }) }).then(() => alert('CV saved!'));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('pipeline')} className={`font-semibold pb-1 border-b-2 ${activeTab === 'pipeline' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Pipeline</button>
          <button onClick={() => setActiveTab('commands')} className={`font-semibold pb-1 border-b-2 ${activeTab === 'commands' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Command Center</button>
          <button onClick={() => setActiveTab('settings')} className={`font-semibold pb-1 border-b-2 ${activeTab === 'settings' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Settings</button>
        </div>
      </nav>

      <main className="p-8">
        {activeTab === 'pipeline' ? (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Job Tracker</h1>
              <button onClick={runScan} disabled={isScanning} className="bg-teal-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-600 shadow-sm transition disabled:bg-slate-300">{isScanning ? 'Scanning...' : 'Run Scan'}</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                  <tr>{['#', 'Date', 'Company', 'Role', 'Score', 'Status', 'PDF', 'Notes'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} onClick={() => openJobDetail(app)} className="hover:bg-teal-50/50 cursor-pointer transition">
                      <td className="px-6 py-4 text-sm text-slate-400">{app.id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{app.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{app.company}</td>
                      <td className="px-6 py-4 text-sm">{app.role}</td>
                      <td className="px-6 py-4 text-sm"><span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">{app.score}</span></td>
                      <td className="px-6 py-4 text-sm">{app.status}</td>
                      <td className="px-6 py-4 text-sm">{app.pdf}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 italic truncate max-w-[200px]">{app.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === 'commands' ? (
          <div className="bg-white p-8 rounded-lg shadow-md grid grid-cols-3 gap-4">
              {[
                  {name: 'Scan Portals', cmd: 'node scan.mjs'},
                  {name: 'Generate CV', cmd: 'node generate-latex.mjs'},
                  {name: 'Run Liveness Check', cmd: 'node check-liveness.mjs'},
                  {name: 'Analyze Patterns', cmd: 'node analyze-patterns.mjs'},
                  {name: 'Verify Pipeline', cmd: 'node verify-pipeline.mjs'},
                  {name: 'Dedup Tracker', cmd: 'node dedup-tracker.mjs'},
              ].map(btn => (
                  <button key={btn.cmd} onClick={() => runCommand(btn.cmd)} className="bg-gray-800 text-white p-4 rounded shadow hover:bg-gray-900">{btn.name}</button>
              ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <div className="mb-6">
              <h3 className="font-bold mb-2">Profile (YAML)</h3>
              <textarea className="w-full h-32 p-2 border rounded" value={typeof profile === 'object' ? JSON.stringify(profile, null, 2) : profile} onChange={(e) => setProfile(e.target.value)} />
              <button onClick={saveProfile} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Save Profile</button>
            </div>
            <div>
              <h3 className="font-bold mb-2">CV (Markdown)</h3>
              <textarea className="w-full h-64 p-2 border rounded" value={cv} onChange={(e) => setCv(e.target.value)} />
              <button onClick={saveCV} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Save CV</button>
            </div>
          </div>
        )}
      </main>

      {selectedJob && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white p-10 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-1">{selectedJob.company}</h2>
                <p className="text-2xl text-blue-600 font-medium">{selectedJob.role}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="text-center md:text-left"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Score</p><p className="font-bold text-xl text-gray-900">{(selectedJob as any).score || selectedJob.score}</p></div>
              <div className="text-center md:text-left"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Status</p><p className="font-bold text-xl text-gray-900">{selectedJob.status}</p></div>
              <div className="text-center md:text-left"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Archetype</p><p className="font-bold text-xl text-gray-900">{(selectedJob as any).archetype || 'N/A'}</p></div>
              <div className="text-center md:text-left"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Legitimacy</p><p className="font-bold text-xl text-gray-900">{(selectedJob as any).legitimacy || 'N/A'}</p></div>
              <div className="text-center md:text-left md:col-span-2"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">URL</p><a href={(selectedJob as any).url} target="_blank" className="font-bold text-xl text-blue-600 truncate block">{(selectedJob as any).url || 'N/A'}</a></div>
            </div>

            <div className="mb-10">
                <h4 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Analysis Notes</h4>
                <div className="bg-blue-50 text-blue-900 p-6 rounded-2xl border border-blue-100 leading-relaxed font-medium">
                  {selectedJob.notes || "No additional notes for this application."}
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-6 border-b pb-4 text-gray-900">Evaluation Report</h3>
            <div className="prose prose-blue max-w-none text-gray-700 leading-7">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
            </div>

            <div className="mt-12 flex gap-4 pt-8 border-t border-gray-100">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold transition">Regenerate CV</button>
                <button className="bg-gray-100 text-gray-800 px-8 py-3 rounded-xl hover:bg-gray-200 font-bold transition">Modify Evaluation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
