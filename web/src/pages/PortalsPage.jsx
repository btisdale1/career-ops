import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { PageHeader, Card, Button } from '../components/ui/index.jsx';
import { Plus, Trash2, Check, X } from 'lucide-react';

export default function PortalsPage() {
  const queryClient = useQueryClient();
  const { data: portals, isLoading } = useQuery({ queryKey: ['portals'], queryFn: api.getPortals });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPortal, setNewPortal] = useState({ name: '', careers_url: '', notes: '', enabled: true });

  const mutation = useMutation({
    mutationFn: (newCompanies) => api.updatePortals({ ...portals, tracked_companies: newCompanies }),
    onSuccess: () => queryClient.invalidateQueries(['portals']),
  });

  const toggleEnabled = (index) => {
    const newCompanies = [...portals.tracked_companies];
    newCompanies[index].enabled = !newCompanies[index].enabled;
    mutation.mutate(newCompanies);
  };

  const removePortal = (index) => {
    if (!window.confirm('Are you sure you want to remove this portal?')) return;
    const newCompanies = [...portals.tracked_companies];
    newCompanies.splice(index, 1);
    mutation.mutate(newCompanies);
  };

  const handleAdd = () => {
    if (!newPortal.name || !newPortal.careers_url) return;
    const newCompanies = [newPortal, ...(portals.tracked_companies || [])];
    mutation.mutate(newCompanies);
    setIsAdding(false);
    setNewPortal({ name: '', careers_url: '', notes: '', enabled: true });
  };

  if (isLoading) return <div className="p-8">Loading portals config...</div>;

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader 
        title="Portals Config" 
        subtitle="Manage tracked companies and ATS settings"
        actions={
          <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Cancel' : 'Add Portal'}
          </Button>
        }
      />
      
      <div className="p-8 space-y-6">
        {isAdding && (
          <Card className="p-6 bg-surface-100 border border-primary-500/20">
            <h3 className="font-heading font-medium text-white mb-4">Add New Portal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Company Name"
                className="bg-surface-200 border border-surface-300/30 rounded-lg px-4 py-2 text-white"
                value={newPortal.name}
                onChange={e => setNewPortal({...newPortal, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Careers URL (e.g., https://jobs.ashbyhq.com/company)"
                className="bg-surface-200 border border-surface-300/30 rounded-lg px-4 py-2 text-white font-mono text-sm"
                value={newPortal.careers_url}
                onChange={e => setNewPortal({...newPortal, careers_url: e.target.value})}
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                className="bg-surface-200 border border-surface-300/30 rounded-lg px-4 py-2 text-white md:col-span-2"
                value={newPortal.notes}
                onChange={e => setNewPortal({...newPortal, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button onClick={handleAdd} disabled={!newPortal.name || !newPortal.careers_url}>
                Save Portal
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-surface-300/20 bg-surface-50 flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-white">Tracked Companies</h2>
            <span className="text-xs text-white/50 bg-surface-200/50 px-2 py-1 rounded-md">
              {portals?.tracked_companies?.length || 0} Total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/40 border-b border-surface-300/20 text-xs bg-surface-50/50">
                <tr>
                  <th className="py-3 px-6 font-medium">Name</th>
                  <th className="py-3 px-6 font-medium">Careers URL</th>
                  <th className="py-3 px-6 font-medium">Notes</th>
                  <th className="py-3 px-6 font-medium text-center">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300/10 text-white/70">
                {(portals?.tracked_companies || []).map((company, i) => (
                  <tr key={i} className={`hover:bg-surface-200/20 transition-colors ${!company.enabled ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-6 font-medium text-white/90">{company.name}</td>
                    <td className="py-3 px-6 text-xs font-mono text-primary-400 max-w-[200px] truncate" title={company.careers_url}>
                      {company.careers_url}
                    </td>
                    <td className="py-3 px-6 text-xs text-white/50 max-w-[200px] truncate" title={company.notes}>
                      {company.notes || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button 
                        onClick={() => toggleEnabled(i)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          company.enabled 
                            ? 'bg-status-offer/10 text-status-offer border-status-offer/20 hover:bg-status-offer/20' 
                            : 'bg-surface-300/10 text-white/40 border-surface-300/20 hover:bg-surface-300/20'
                        }`}
                      >
                        {company.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button 
                        onClick={() => removePortal(i)}
                        className="p-1.5 text-white/30 hover:text-status-rejected hover:bg-status-rejected/10 rounded-md transition-colors"
                        title="Remove Portal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
