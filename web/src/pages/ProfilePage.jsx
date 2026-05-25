import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Card, PageHeader, Button } from '../components/ui/index.jsx';
import { Save, Plus, Trash2, User, MapPin, DollarSign, BookOpen } from 'lucide-react';

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile && !form) {
      const copy = JSON.parse(JSON.stringify(profile));
      // Ensure all objects exist to avoid undefined errors
      if (!copy.candidate) copy.candidate = {};
      if (!copy.target_roles) copy.target_roles = { primary: [], archetypes: [] };
      if (!copy.narrative) copy.narrative = { gap_handling: '', exit_story: '' };
      if (!copy.compensation) copy.compensation = { target_range: '', currency: '', location_flexibility: '' };
      if (!copy.location) copy.location = { country: '', city: '', timezone: '', visa_status: '' };
      setForm(copy);
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

  if (isLoading || !form) return <div className="p-8 animate-pulse text-white/50">Loading profile...</div>;

  return (
    <div className="animate-fade-in pb-16">
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
        {/* Identity & Languages */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-surface-300/10 pb-3">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-heading font-semibold text-white">Identity & Language</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" value={form.candidate?.full_name} onChange={v => { form.candidate.full_name = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Email" value={form.candidate?.email} onChange={v => { form.candidate.email = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Phone" value={form.candidate?.phone} onChange={v => { form.candidate.phone = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Language Preference" value={form.candidate?.language_preference} onChange={v => { form.candidate.language_preference = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g., English only, German & English" />
            <Field label="LinkedIn URL" value={form.candidate?.linkedin} onChange={v => { form.candidate.linkedin = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Portfolio URL" value={form.candidate?.portfolio_url} onChange={v => { form.candidate.portfolio_url = v; setForm({...form}); setIsDirty(true); }} />
          </div>
        </Card>

        {/* Location Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-surface-300/10 pb-3">
            <MapPin className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-heading font-semibold text-white">Location details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Country" value={form.location?.country} onChange={v => { form.location.country = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="City / State" value={form.location?.city} onChange={v => { form.location.city = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Timezone" value={form.location?.timezone} onChange={v => { form.location.timezone = v; setForm({...form}); setIsDirty(true); }} />
            <Field label="Visa Status" value={form.location?.visa_status} onChange={v => { form.location.visa_status = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g., No sponsorship needed" />
          </div>
          <Field label="General Location Policy / Custom location field" value={form.candidate?.location} onChange={v => { form.candidate.location = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g. Castroville, TX (or Remote)" />
        </Card>

        {/* Target Roles & Archetypes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-surface-300/10 pb-3">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-heading font-semibold text-white">Target Roles & Archetypes</h2>
          </div>
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
                  <div key={idx} className="flex gap-3 items-start flex-wrap md:flex-nowrap">
                    <input type="text" placeholder="Name (e.g. SRE)" className="flex-1 min-w-[200px] bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" value={arch.name || ''} onChange={e => { arch.name = e.target.value; setForm({...form}); setIsDirty(true); }} />
                    <input type="text" placeholder="Level (e.g. Senior)" className="w-full md:w-32 bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" value={arch.level || ''} onChange={e => { arch.level = e.target.value; setForm({...form}); setIsDirty(true); }} />
                    <select className="w-full md:w-32 bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50" value={arch.fit || 'primary'} onChange={e => { arch.fit = e.target.value; setForm({...form}); setIsDirty(true); }}>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="adjacent">Adjacent</option>
                    </select>
                    <button onClick={() => { form.target_roles.archetypes.splice(idx, 1); setForm({...form}); setIsDirty(true); }} className="p-2 text-white/30 hover:text-status-rejected mt-0.5 self-center">
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

        {/* Compensation Targets */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-surface-300/10 pb-3">
            <DollarSign className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-heading font-semibold text-white">Compensation Targets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Target Range" value={form.compensation?.target_range} onChange={v => { form.compensation.target_range = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g. $110K-180K" />
            <Field label="Currency" value={form.compensation?.currency} onChange={v => { form.compensation.currency = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g. USD" />
            <Field label="Location Flexibility" value={form.compensation?.location_flexibility} onChange={v => { form.compensation.location_flexibility = v; setForm({...form}); setIsDirty(true); }} placeholder="e.g. Remote preferred" />
          </div>
        </Card>

        {/* Career Narrative */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-surface-300/10 pb-3">
            <Save className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-heading font-semibold text-white">Career Narrative</h2>
          </div>
          <div className="space-y-4">
            <TextareaField
              label="Gap Handling Story"
              value={form.narrative?.gap_handling}
              onChange={v => { form.narrative.gap_handling = v; setForm({...form}); setIsDirty(true); }}
              placeholder="How to frame transitions or employment gaps during interviews..."
            />
            <TextareaField
              label="Exit Story"
              value={form.narrative?.exit_story}
              onChange={v => { form.narrative.exit_story = v; setForm({...form}); setIsDirty(true); }}
              placeholder="The formal explanation for leaving your last role..."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{label}</label>
      <input
        type="text"
        value={value || ''}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 transition-colors"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{label}</label>
      <textarea
        value={value || ''}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full bg-surface-200 border border-surface-300/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 transition-colors resize-y font-sans leading-relaxed"
      />
    </div>
  );
}
