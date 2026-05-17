const STATUS_CONFIG = {
  evaluated:  { label: 'Evaluated',  bg: 'bg-status-evaluated/15',  text: 'text-status-evaluated',  ring: 'ring-status-evaluated/30' },
  interested: { label: 'Interested', bg: 'bg-status-interested/15', text: 'text-status-interested', ring: 'ring-status-interested/30' },
  applied:    { label: 'Applied',    bg: 'bg-status-applied/15',    text: 'text-status-applied',    ring: 'ring-status-applied/30' },
  responded:  { label: 'Responded',  bg: 'bg-status-responded/15',  text: 'text-status-responded',  ring: 'ring-status-responded/30' },
  interview:  { label: 'Interview',  bg: 'bg-status-interview/15',  text: 'text-status-interview',  ring: 'ring-status-interview/30' },
  offer:      { label: 'Offer',      bg: 'bg-status-offer/15',      text: 'text-status-offer',      ring: 'ring-status-offer/30' },
  rejected:   { label: 'Rejected',   bg: 'bg-status-rejected/15',   text: 'text-status-rejected',   ring: 'ring-status-rejected/30' },
  discarded:  { label: 'Discarded',  bg: 'bg-status-discarded/15',  text: 'text-status-discarded',  ring: 'ring-status-discarded/30' },
  skip:       { label: 'SKIP',       bg: 'bg-status-skip/15',       text: 'text-status-skip',       ring: 'ring-status-skip/30' },
};

export function StatusBadge({ status, className = '' }) {
  const normalized = normalizeStatus(status);
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.evaluated;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${config.bg} ${config.text} ${config.ring} ${className}`}>
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score, className = '' }) {
  if (!score || score <= 0) return <span className="text-white/30 text-xs">—</span>;
  let color = 'text-status-rejected';
  if (score >= 4.5) color = 'text-status-offer';
  else if (score >= 4.0) color = 'text-status-applied';
  else if (score >= 3.5) color = 'text-status-responded';

  return (
    <span className={`font-mono font-semibold text-sm ${color} ${className}`}>
      {score.toFixed(1)}
    </span>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-surface-100 border border-surface-300/40 rounded-xl ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-surface-300/30">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-50';
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-400 focus:ring-primary-400 shadow-lg shadow-primary-500/20',
    secondary: 'bg-surface-200 text-white/80 hover:bg-surface-300 hover:text-white focus:ring-surface-400',
    ghost: 'text-white/60 hover:text-white hover:bg-surface-200/60 focus:ring-surface-400',
    danger: 'bg-status-rejected/20 text-status-rejected hover:bg-status-rejected/30 focus:ring-status-rejected',
  };
  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-12 h-12 text-white/15 mb-4" />}
      <h3 className="text-lg font-semibold text-white/70">{title}</h3>
      {description && <p className="text-sm text-white/40 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function normalizeStatus(raw) {
  const s = (raw || '').replace(/\*\*/g, '').trim().toLowerCase();
  if (s.includes('skip') || s.includes('no aplicar')) return 'skip';
  if (s.includes('interview') || s.includes('entrevista')) return 'interview';
  if (s === 'offer' || s.includes('oferta')) return 'offer';
  if (s.includes('responded') || s.includes('respondido')) return 'responded';
  if (s.includes('applied') || s.includes('aplicado') || s === 'enviada') return 'applied';
  if (s.includes('interested') || s.includes('interesado') || s.includes('interesada')) return 'interested';
  if (s.includes('rejected') || s.includes('rechazado')) return 'rejected';
  if (s.includes('discarded') || s.includes('descartado') || s === 'cerrada') return 'discarded';
  if (s.includes('evaluated') || s.includes('evaluada')) return 'evaluated';
  return 'evaluated';
}

export { normalizeStatus };
