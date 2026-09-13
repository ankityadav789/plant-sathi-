import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Droplets, Sun, Bug, FlaskConical } from 'lucide-react';
import GlowCard from './ui/GlowCard.jsx';

export default function PlantCareCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysCount = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Mock schedule data
  const schedule = {
    3: [{ type: 'water', plant: 'Monstera', icon: Droplets, color: 'text-aurora-blue', bg: 'bg-aurora-blue/20' }],
    8: [{ type: 'fertilize', plant: 'Ficus', icon: FlaskConical, color: 'text-aurora-purple', bg: 'bg-aurora-purple/20' }],
    12: [
      { type: 'water', plant: 'Monstera', icon: Droplets, color: 'text-aurora-blue', bg: 'bg-aurora-blue/20' },
      { type: 'sun', plant: 'Snake Plant', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
    ],
    18: [{ type: 'disease', plant: 'Check Peace Lily', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/20' }],
    25: [{ type: 'water', plant: 'All Indoor', icon: Droplets, color: 'text-aurora-blue', bg: 'bg-aurora-blue/20' }],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pt-24 px-4 min-h-screen">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-plant-500/10 flex items-center justify-center">
          <CalendarIcon className="w-7 h-7 text-plant-500" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">Care Calendar</h2>
          <p className="text-white/40">AI synchronized maintenance schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <GlowCard className="h-full">
            <div className="p-6 h-full flex flex-col">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-display font-bold text-white/95">{monthNames[month]} {year}</h3>
                 <div className="flex gap-2">
                   <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors border-none cursor-pointer text-white/80"><ChevronLeft className="w-5 h-5" /></button>
                   <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors border-none cursor-pointer text-white/80"><ChevronRight className="w-5 h-5" /></button>
                 </div>
               </div>

               <div className="grid grid-cols-7 gap-px bg-white/10 rounded-2xl overflow-hidden shadow-2xl flex-1">
                 {/* Weekday headers */}
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="bg-surface-900/90 backdrop-blur-md p-3 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
                     {d}
                   </div>
                 ))}
                 
                 {/* Blank days */}
                 {[...Array(startDay)].map((_, i) => (
                   <div key={`blank-${i}`} className="bg-surface-900/40 p-2 min-h-[120px]" />
                 ))}

                 {/* Days */}
                 {[...Array(daysCount)].map((_, i) => {
                   const day = i + 1;
                   const events = schedule[day] || [];
                   const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                   return (
                     <div key={day} className={`p-3 min-h-[120px] transition-colors relative group ${isToday ? 'bg-plant-500/5' : 'bg-surface-900/80 hover:bg-surface-900/90'}`}>
                       {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-plant-500" />}
                       <span className={`text-sm font-bold ${isToday ? 'text-plant-500' : 'text-white/60'}`}>{day}</span>
                       
                       <div className="mt-2 flex flex-col gap-1.5">
                         {events.map((evt, idx) => (
                           <motion.div 
                             key={idx}
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className={`px-2 py-1.5 rounded-lg flex items-center gap-2 ${evt.bg} ${evt.color} cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis`}
                           >
                             <evt.icon className="w-3.5 h-3.5 flex-shrink-0" />
                             <span className="text-xs font-semibold truncate">{evt.plant}</span>
                           </motion.div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </GlowCard>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <GlowCard>
            <div className="p-6">
              <h3 className="font-display font-semibold text-white/90 text-lg mb-4">Upcoming AI Tasks</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-aurora-blue" />
                    <span className="font-semibold text-white/90 text-sm">Water Ficus</span>
                  </div>
                  <p className="text-xs text-white/50">Tomorrow at 8:00 AM</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <FlaskConical className="w-4 h-4 text-aurora-purple" />
                    <span className="font-semibold text-white/90 text-sm">Fertilize Monstera</span>
                  </div>
                  <p className="text-xs text-white/50">In 2 days</p>
                </div>
              </div>
            </div>
          </GlowCard>
          
          <GlowCard glowColor="rgba(0,230,118,0.15)">
            <div className="p-6">
              <h3 className="font-display font-semibold text-white/90 text-lg mb-2">Smart Sync</h3>
              <p className="text-sm text-white/50 mb-4 leading-relaxed">AI has automatically delayed watering for 3 outdoor plants due to forecasted rain on Thursday.</p>
              <button className="w-full py-2.5 rounded-xl bg-plant-500/10 text-plant-500 hover:bg-plant-500 text-surface-900 border border-plant-500/30 transition-all font-semibold text-sm cursor-pointer">
                Review Changes
              </button>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
