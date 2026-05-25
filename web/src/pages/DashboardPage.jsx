import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Card, PageHeader, ScoreBadge, StatusBadge } from '../components/ui/index.jsx';
import {
  Target, Send, MessageSquare, Users, Trophy,
  TrendingUp, FileCheck, Zap, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const FUNNEL_COLORS = ['#5eaab5', '#5eaab5', '#e5a54b', '#9b6dd7', '#4eca8b'];
const SCORE_COLORS = ['#4eca8b', '#5eaab5', '#e5a54b', '#e07a5f', '#8b5c5c'];

export default function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useQuery({ queryKey: ['metrics'], queryFn: api.getMetrics });
  const { data: apps, isLoading: loadingApps } = useQuery({ queryKey: ['applications'], queryFn: api.getApplications });

  if (loadingMetrics || loadingApps) return <LoadingSkeleton />;

  const recentApps = (apps || []).slice(-8).reverse();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Command Center" subtitle="Your job search at a glance" />

      <div className="p-8 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <KpiCard icon={Target} label="Tracked" value={metrics?.total || 0} />
          <KpiCard icon={Send} label="Applied" value={metrics?.byStatus?.applied || 0} color="text-status-applied" />
          <KpiCard icon={MessageSquare} label="Responded" value={metrics?.byStatus?.responded || 0} color="text-status-responded" />
          <KpiCard icon={Users} label="Interviews" value={metrics?.byStatus?.interview || 0} color="text-status-interview" />
          <KpiCard icon={Trophy} label="Offers" value={metrics?.byStatus?.offer || 0} color="text-status-offer" />
          <KpiCard icon={TrendingUp} label="Avg Score" value={metrics?.avgScore?.toFixed(1) || '—'} color="text-primary-300" />
        </div>

        {/* Funnel & Conversion Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Funnel */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="font-heading text-lg font-semibold text-white mb-4">Pipeline Funnel</h2>
            <div className="space-y-2.5">
              {(metrics?.funnel || []).map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20 text-right">{stage.label}</span>
                  <div className="flex-1 h-8 bg-surface-200 rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(stage.count > 0 ? 3 : 0, (stage.count / Math.max(metrics?.total || 1, 1)) * 100)}%`,
                        backgroundColor: FUNNEL_COLORS[i],
                        opacity: 0.7,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-mono font-medium text-white/80">
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Conversion Rates */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-white">Conversion Rates</h2>
                <span className="text-[10px] text-white/40 font-mono bg-surface-200 px-2 py-0.5 rounded border border-surface-300/10">
                  TUI Metrics
                </span>
              </div>
              <p className="text-xs text-white/50 mb-6 leading-relaxed">
                Visual efficiency metrics and pipeline conversion conversion health.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <CircularProgress
                  value={metrics?.responseRate || 0}
                  label="Response"
                  subtitle="Reply/Applied"
                  colorClass={getRateColor(metrics?.responseRate || 0)}
                />
                <CircularProgress
                  value={metrics?.interviewRate || 0}
                  label="Interview"
                  subtitle="Intvw/Applied"
                  colorClass={getRateColor(metrics?.interviewRate || 0)}
                />
                <CircularProgress
                  value={metrics?.offerRate || 0}
                  label="Offer"
                  subtitle="Offer/Applied"
                  colorClass={getRateColor(metrics?.offerRate || 0)}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-300/10 flex items-center justify-between text-xs text-white/40 font-mono">
              <span className="flex items-center gap-1">🎯 Active: <strong className="text-white/80 font-bold">{metrics?.actionable || 0}</strong></span>
              <span className="flex items-center gap-1">🏆 Offers: <strong className="text-white/80 font-bold">{metrics?.byStatus?.offer || 0}</strong></span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-white mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics?.scoreBuckets || []} barCategoryGap="20%">
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(metrics?.scoreBuckets || []).map((_, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Weekly Activity */}
          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-white mb-4">Weekly Activity</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics?.weeklyActivity || []}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#5eaab5" opacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-300/30">
            <h2 className="font-heading text-lg font-semibold text-white">Recent Applications</h2>
            <Link to="/pipeline" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-surface-300/20">
                  <th className="px-6 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-300/15">
                {recentApps.map((app, i) => (
                  <tr key={i} className="hover:bg-surface-200/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-white/90">{app.company}</td>
                    <td className="px-4 py-3 text-sm text-white/60 max-w-[240px] truncate">{app.role}</td>
                    <td className="px-4 py-3"><ScoreBadge score={app.score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">{app.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentApps.length === 0 && (
            <div className="py-12 text-center text-white/30 text-sm">No applications tracked yet</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color = 'text-white' }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-white/40">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-heading font-bold ${color}`}>{value}</span>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-surface-200 rounded-lg" />
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-200 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-surface-200 rounded-xl" />
    </div>
  );
}

/* ── Conversion Rate Helper Components ───────────────────────── */
function CircularProgress({ value, label, subtitle, colorClass }) {
  const radius = 28;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          {/* Base Track */}
          <circle
            className="stroke-surface-300/30"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx="32"
            cy="32"
          />
          {/* Progress fill */}
          <circle
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx="32"
            cy="32"
          />
        </svg>
        <span className="absolute text-[11px] font-semibold font-mono text-white/95">
          {value.toFixed(0)}%
        </span>
      </div>
      <span className="text-xs font-semibold text-white/80 mt-2 tracking-tight">{label}</span>
      <span className="text-[9px] text-white/30 mt-0.5 tracking-tight font-mono">{subtitle}</span>
    </div>
  );
}

function getRateColor(rate) {
  if (rate >= 30) return 'stroke-status-offer';
  if (rate >= 15) return 'stroke-status-responded';
  if (rate >= 5) return 'stroke-status-interested';
  return 'stroke-status-rejected';
}

