import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { PageHeader, Button } from '../components/ui/index.jsx';
import { Save, Download, Eye, Code } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CvEditorPage() {
  const { data, isLoading } = useQuery({ queryKey: ['cv'], queryFn: api.getCv });
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState('split'); // split, edit, preview

  useEffect(() => {
    if (data?.content && !content) setContent(data.content);
  }, [data]);

  const mutation = useMutation({
    mutationFn: api.updateCv,
    onSuccess: () => {
      queryClient.invalidateQueries(['cv']);
      setIsDirty(false);
    },
  });

  const pdfMutation = useMutation({
    mutationFn: () => fetch('/api/pdf/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlPath: '/tmp/cv.html', outputPath: 'output/cv-latest.pdf' })
    }).then(res => res.json())
  });

  if (isLoading) return <div className="p-8">Loading CV...</div>;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="CV Editor"
        subtitle="Markdown source of truth"
        actions={
          <div className="flex gap-2">
            <div className="bg-surface-200 rounded-lg p-1 flex">
              <button onClick={() => setPreviewMode('edit')} className={`px-3 py-1 rounded-md text-xs font-medium ${previewMode === 'edit' ? 'bg-surface-400 text-white' : 'text-white/50'}`}>Edit</button>
              <button onClick={() => setPreviewMode('split')} className={`px-3 py-1 rounded-md text-xs font-medium ${previewMode === 'split' ? 'bg-surface-400 text-white' : 'text-white/50'}`}>Split</button>
              <button onClick={() => setPreviewMode('preview')} className={`px-3 py-1 rounded-md text-xs font-medium ${previewMode === 'preview' ? 'bg-surface-400 text-white' : 'text-white/50'}`}>Preview</button>
            </div>
            <Button variant="secondary" onClick={() => mutation.mutate(content)} disabled={!isDirty || mutation.isPending}>
              <Save className="w-4 h-4" /> Save
            </Button>
            <Button variant="primary" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}>
              <Download className="w-4 h-4" /> {pdfMutation.isPending ? 'Generating...' : 'PDF'}
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
        {(previewMode === 'split' || previewMode === 'edit') && (
          <div className={`flex-1 border-r border-surface-300/30 ${previewMode === 'edit' ? 'w-full max-w-4xl mx-auto border-x' : 'w-1/2'}`}>
            <textarea
              className="w-full h-full bg-surface-50 text-white/90 p-8 font-mono text-[15px] leading-relaxed resize-none focus:outline-none"
              value={content}
              spellCheck={false}
              onChange={e => { setContent(e.target.value); setIsDirty(true); }}
            />
          </div>
        )}
        
        {(previewMode === 'split' || previewMode === 'preview') && (
          <div className={`flex-1 overflow-y-auto bg-surface-100 p-8 ${previewMode === 'preview' ? 'w-full flex justify-center' : 'w-1/2'}`}>
            <div className={`prose prose-invert max-w-none ${previewMode === 'preview' ? 'w-full max-w-4xl bg-surface-50 p-10 rounded-xl shadow-lg border border-surface-300/20' : ''}`}>
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
