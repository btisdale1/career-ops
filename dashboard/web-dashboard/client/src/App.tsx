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

  useEffect(() => {
    fetch('http://localhost:3001/api/applications')
      .then((res) => res.json())
      .then((data) => {
        const lines = data.content.split('\n');
        const tableRows = lines.slice(4); // Skip header and separator
        const parsed = tableRows
          .filter((row: string) => row.includes('|'))
          .map((row: string) => {
            const cols = row.split('|').map((col) => col.trim());
            return {
              id: cols[1],
              date: cols[2],
              company: cols[3],
              role: cols[4],
              score: cols[5],
              status: cols[6],
              pdf: cols[7],
              report: cols[8],
              notes: cols[9],
            };
          });
        setApplications(parsed);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Career-Ops Pipeline</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Date', 'Company', 'Role', 'Score', 'Status', 'PDF', 'Report', 'Notes'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.report}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
