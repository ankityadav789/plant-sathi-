import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Droplets, Bug, Leaf, Activity } from 'lucide-react';
import GlowCard from './ui/GlowCard.jsx';

function AnimatedBar({ value, maxValue = 100, color, label, delay = 0 }) {
  return (
    <div className="flex items-end gap-1 flex-col">
      <div className="w-full flex items-end justify-center h-40">
        <motion.div
          className="w-full max-w-[40px] rounded-t-lg"
          style={{ background: `linear-gradient(to top, ${color}40, ${color})` }}
          initial={{ height: 0 }}
          whileInView={{ height: `${(value / maxValue) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white/50 text-[10px] font-semibold mt-1 text-center w-full">{label}</span>
    </div>
  );
}

function MiniLineChart({ data, color, label }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 80;
  const w = 280;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-white/80 font-display font-semibold">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{data[data.length - 1]}%</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        <polygon points={areaPoints} fill={`${color}15`} />
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const weeklyHealth = [72, 74, 73, 78, 76, 80, 82];
  const monthlyGrowth = [30, 33, 35, 37, 39, 41, 43, 45, 47, 50, 53, 57];
  const waterUsage = [200, 180, 220, 150, 0, 190, 200];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-aurora-purple/10 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-aurora-purple" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">Analytics</h2>
          <p className="text-white/40">Weekly and monthly plant insights</p>
        </div>
      </div>

      {/* Line Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlowCard>
          <div className="p-6">
            <MiniLineChart data={weeklyHealth} color="#00e676" label="Weekly Health Score" />
            <div className="flex justify-between text-[10px] text-white/30 mt-2">
              {weekDays.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </GlowCard>

        <GlowCard>
          <div className="p-6">
            <MiniLineChart data={monthlyGrowth} color="#3b82f6" label="Monthly Growth (cm)" />
            <div className="flex justify-between text-[10px] text-white/30 mt-2">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Water Usage Bar Chart */}
      <GlowCard>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Droplets className="w-5 h-5 text-aurora-blue" />
            <h3 className="font-display font-semibold text-white/90 text-lg">Water Usage (ml)</h3>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {waterUsage.map((val, i) => (
              <AnimatedBar key={i} value={val} maxValue={250} color="#3b82f6" label={weekDays[i]} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: 'Avg Health', value: '76%', color: 'text-plant-500', bg: 'bg-plant-500/10' },
          { icon: TrendingUp, label: 'Growth Rate', value: '+2.3cm/mo', color: 'text-aurora-blue', bg: 'bg-aurora-blue/10' },
          { icon: Droplets, label: 'Water Saved', value: '1.2L', color: 'text-aurora-teal', bg: 'bg-aurora-teal/10' },
          { icon: Bug, label: 'Disease Events', value: '1', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <GlowCard>
              <div className="p-5 text-center">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="text-white/90 font-display font-bold text-2xl">{s.value}</div>
                <div className="text-white/40 text-xs mt-1 uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* Disease History */}
      <GlowCard>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bug className="w-5 h-5 text-yellow-500" />
            <h3 className="font-display font-semibold text-white/90 text-lg">Disease History</h3>
          </div>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-white/40 font-semibold">Date</th>
                  <th className="text-left py-3 text-white/40 font-semibold">Disease</th>
                  <th className="text-left py-3 text-white/40 font-semibold">Severity</th>
                  <th className="text-left py-3 text-white/40 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/70">Jul 5, 2026</td>
                  <td className="py-3 text-white/90 font-medium">Mild Leaf Spot</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs font-bold">Low</span></td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-plant-500/20 text-plant-500 text-xs font-bold">Treated</span></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/70">May 12, 2026</td>
                  <td className="py-3 text-white/90 font-medium">Root Rot (Early)</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-500 text-xs font-bold">Medium</span></td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-plant-500/20 text-plant-500 text-xs font-bold">Resolved</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>

      {/* Sustainability Stats */}
      <GlowCard glowColor="rgba(0,230,118,0.15)">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Leaf className="w-5 h-5 text-plant-500" />
            <h3 className="font-display font-semibold text-white/90 text-lg">Sustainability Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'CO₂ Absorbed', value: '12.4 kg', color: 'text-plant-500' },
              { label: 'O₂ Produced', value: '9.2 kg', color: 'text-aurora-blue' },
              { label: 'Water Optimized', value: '3.8L', color: 'text-aurora-teal' },
              { label: 'Green Score', value: '82/100', color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className={`text-2xl font-display font-bold mb-1 ${s.color}`}>{s.value}</div>
                <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>
    </div>
  );
}
