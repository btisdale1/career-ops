import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/api/applications')
      .then((res) => res.json())
      .then((data) => setData(data.content))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Career-Ops Pipeline</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <pre className="whitespace-pre-wrap text-sm text-gray-700">{data}</pre>
      </div>
    </div>
  );
}

export default App;
