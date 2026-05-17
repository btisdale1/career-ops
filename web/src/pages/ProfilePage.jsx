import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Card, PageHeader, Button } from '../components/ui/index.jsx';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile && !form) {
      setForm(JSON.parse(JSON.stringify(profile))); // Deep copy
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsDirty(false);
    },
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  if (isLoading || !form) return <div className="p-8 animate-pulse">Loading profile...</div>;

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader
        title="Profile Builder"
        subtitle="Manage your identity, targets, and narratives"
        actions={
          <Button onClick={handleSave} disabled={!isDirty || mutation.isPending}>
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        }
      />

      <div className="p-8 max-w-4xl space-y-8">
        <Card className="p-6">
          <h2 className="text-lg font-heading font-semibold text-white mb-4">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={form.candidate?.full_name} onChange={v => { form.candidate.full_name = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Email" value={form.candidate?.email} onChange={v => { form.candidate.email = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Phone" value={form.candidate?.phone} onChange={v => { form.candidate.phone = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Location" value={form.candidate?.location} onChange={v => { form.candidate.location = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="LinkedIn URL" value={form.candidate?.linkedin} onChange={v => { form.candidate.linkedin = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Portfolio URL" value={form.candidate?.portfolio_url} onChange={v => { form.candidate.portfolio_url = v; setForm({...form}); setIsDirty(true); }} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-heading font-semibold text-white mb-4">Target Roles & Archetypes</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Primary Target Roles (comma separated)</label>
              <input
                type="text"
                className="w-full bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
                value={(form.target_roles?.primary || []).join(', ')}
                onChange={e => {
                  form.target_roles.primary = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setForm({...form}); setIsDirty(true);
                }}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Archetypes</label>
              <div className="space-y-3">
                {(form.target_roles?.archetypes || []).map((arch, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <input type="text" placeholder="Name (e.g. AI PM)" className="flex-1 bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white" value={arch.name || ''} onChange={e => { arch.name = e.target.value; setForm({...form}); setIsDirty(true); }} />
                    <input type="text" placeholder="Level (e.g. Senior)" className="w-32 bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white" value={arch.level || ''} onChange={e => { arch.level = e.target.value; setForm({...form}); setIsDirty(true); }} />
                    <select className="w-32 bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white" value={arch.fit || 'primary'} onChange={e => { arch.fit = e.target.value; setForm({...form}); setIsDirty(true); }}>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="adjacent">Adjacent</option>
                    </select>
                    <button onClick={() => { form.target_roles.archetypes.splice(idx, 1); setForm({...form}); setIsDirty(true); }} className="p-2 text-white/30 hover:text-status-rejected mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={() => { 
                  if (!form.target_roles.archetypes) form.target_roles.archetypes = [];
                  form.target_roles.archetypes.push({ name: '', level: '', fit: 'primary' });
                  setForm({...form}); setIsDirty(true);
                }}>
                  <Plus className="w-3 h-3" /> Add Archetype
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-colors"
      />
    </div>
  );
}
