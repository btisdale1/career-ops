import React, { useEffect, useState } from 'react';

interface Application {
  id: string; date: string; company: string; role: string; score: string; status: string; pdf: string; report: string; notes: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'settings'>('pipeline');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [cv, setCv] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/api/applications').then(res => res.json()).then(data => {
      const lines = data.content.split('\n');
      const tableRows = lines.slice(4);
      setApplications(tableRows.filter((row: string) => row.includes('|')).map((row: string) => {
        const cols = row.split('|').map((col) => col.trim());
        const reportMatch = cols[8].match(/\((reports\/[^)]+)\)/);
        return { id: cols[1], date: cols[2], company: cols[3], role: cols[4], score: cols[5], status: cols[6], pdf: cols[7], report: reportMatch ? reportMatch[1] : '', notes: cols[9] };
      }));
    });
    fetch('http://localhost:3001/api/profile').then(res => res.json()).then(data => setProfile(data.content));
    fetch('http://localhost:3001/api/cv').then(res => res.json()).then(data => setCv(data.content));
  }, []);

  const openReport = (reportPath: string) => {
    const filename = reportPath.replace('reports/', '');
    fetch(`http://localhost:3001/api/reports/${filename}`).then(res => res.json()).then(data => { setReportContent(data.content); setSelectedReport(filename); });
  };

  const runScan = () => {
    setIsScanning(true);
    fetch('http://localhost:3001/api/scan', { method: 'POST' }).then(() => { alert('Scan completed!'); setIsScanning(false); });
  };

  const saveProfile = () => {
    fetch('http://localhost:3001/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }).then(() => alert('Profile saved!'));
  };

  const saveCV = () => {
    fetch('http://localhost:3001/api/cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: cv }) }).then(() => alert('CV saved!'));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('pipeline')} className={`px-4 py-2 rounded ${activeTab === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Pipeline</button>
        <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Settings</button>
      </div>

      {activeTab === 'pipeline' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Career-Ops Pipeline</h1>
            <button onClick={runScan} disabled={isScanning} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400">{isScanning ? 'Scanning...' : 'Run Scan'}</button>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{['#', 'Date', 'Company', 'Role', 'Score', 'Status', 'PDF', 'Report', 'Notes'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">{applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.pdf}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.report && <button onClick={() => openReport(app.report)} className="text-blue-600 hover:text-blue-900">View</button>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.notes}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
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

      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedReport}</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{reportContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
