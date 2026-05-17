import React, { useEffect, useState } from 'react';

interface Application {
  id: string;
  date: string;
  company: string;
  role: string;
  score: string;
  status: string;
  pdf: string;
  report: string;
  notes: string;
}

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/api/applications')
      .then((res) => res.json())
      .then((data) => {
        const lines = data.content.split('\n');
        const tableRows = lines.slice(4);
        const parsed = tableRows
          .filter((row: string) => row.includes('|'))
          .map((row: string) => {
            const cols = row.split('|').map((col) => col.trim());
            // Extract filename from markdown link [010](reports/010-webflow-senior-sre-2026-05-16.md)
            const reportMatch = cols[8].match(/\((reports\/[^)]+)\)/);
            return {
              id: cols[1],
              date: cols[2],
              company: cols[3],
              role: cols[4],
              score: cols[5],
              status: cols[6],
              pdf: cols[7],
              report: reportMatch ? reportMatch[1] : '',
              notes: cols[9],
            };
          });
        setApplications(parsed);
      })
      .catch((err) => console.error(err));
  }, []);

  const openReport = (reportPath: string) => {
    const filename = reportPath.replace('reports/', '');
    fetch(`http://localhost:3001/api/reports/${filename}`)
      .then((res) => res.json())
      .then((data) => {
        setReportContent(data.content);
        setSelectedReport(filename);
      })
      .catch((err) => console.error(err));
  };

  const [isScanning, setIsScanning] = useState(false);

  const runScan = () => {
    setIsScanning(true);
    fetch('http://localhost:3001/api/scan', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        alert('Scan completed!');
        setIsScanning(false);
      })
      .catch((err) => {
        console.error(err);
        setIsScanning(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Career-Ops Pipeline</h1>
        <button 
          onClick={runScan}
          disabled={isScanning}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Date', 'Company', 'Role', 'Score', 'Status', 'PDF', 'Report', 'Notes'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.score}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.pdf}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {app.report && (
                    <button onClick={() => openReport(app.report)} className="text-blue-600 hover:text-blue-900">View</button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
