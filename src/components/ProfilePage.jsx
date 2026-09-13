import { motion } from 'framer-motion';
import { User, Settings, Award, History, Leaf, Shield, Crown, Zap, Edit3, LogOut, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { gardenPlants, language } = useAppContext();
  
  const plantsCount = gardenPlants.length;
  const greenPoints = plantsCount * 150;
  
  const profile = {
    name: "Alex Green",
    handle: "@alexg_botany",
    level: Math.max(1, Math.floor(plantsCount / 2)),
    points: greenPoints.toLocaleString(),
    joinDate: "July 2026",
    avatar: "AG"
  };

  const leaderboard = [
    { rank: 1, name: "Sarah Woods", points: "4,200", isMe: false },
    { rank: 2, name: "David Chen", points: "3,850", isMe: false },
    { rank: 3, name: "Alex Green", points: greenPoints.toLocaleString(), isMe: true },
    { rank: 4, name: "Elena R.", points: "2,100", isMe: false },
    { rank: 5, name: "Marcus T.", points: "1,950", isMe: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Profile section */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left pt-4">
        
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-surface-900 bg-gradient-to-br from-plant-500 to-aurora-teal flex items-center justify-center shadow-2xl relative z-10">
            <span className="text-4xl font-display font-bold text-surface-900">{profile.avatar}</span>
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-surface-900 rounded-full">
            <div className="px-3 py-1 rounded-full bg-aurora-teal/20 border border-aurora-teal text-aurora-teal text-xs font-bold whitespace-nowrap">
              {t('profile.level', { val: profile.level })}
            </div>
          </div>
          {/* Animated rings */}
          <motion.div className="absolute inset-0 rounded-full border border-plant-500/30 -z-0" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
        </div>

        <div className="flex-1">
          <h1 className="text-4xl font-display font-bold text-white/95">{profile.name}</h1>
          <p className="text-white/40 font-medium mb-4">{profile.handle} • {t('profile.memberSince', { date: profile.joinDate })}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-plant-500" />
              <span className="text-white/80 font-bold">{profile.points} <span className="text-white/40 font-normal">{t('profile.greenPoints')}</span></span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/80 hover:bg-white/10 transition-colors cursor-pointer">
              <Edit3 className="w-4 h-4" /> {t('profile.editProfile')}
            </button>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/80 hover:bg-white/10 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Left Col: Badges & Settings */}
        <div className="space-y-6">
          <GlowCard>
             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-display font-semibold text-white/90 text-lg flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> {t('profile.badges')}</h3>
                   <span className="text-plant-500 text-xs font-semibold cursor-pointer">{t('profile.viewAll')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                   <div className="flex flex-col items-center gap-2 text-center group cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Crown className="w-6 h-6 text-yellow-500" />
                      </div>
                      <span className="text-white/80 text-[10px] font-bold">{t('profile.badgeTop')}</span>
                   </div>
                   <div className={`flex flex-col items-center gap-2 text-center group cursor-pointer ${plantsCount >= 2 ? '' : 'opacity-40'}`}>
                      <div className="w-14 h-14 rounded-full bg-plant-500/10 border border-plant-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-plant-500" />
                      </div>
                      <span className="text-white/80 text-[10px] font-bold">{plantsCount >= 2 ? t('profile.badgePestGuard') : t('profile.badgeLocked')}</span>
                   </div>
                   <div className={`flex flex-col items-center gap-2 text-center group cursor-pointer ${plantsCount >= 5 ? '' : 'opacity-40'}`}>
                      <div className="w-14 h-14 rounded-full bg-aurora-blue/10 border border-aurora-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6 text-aurora-blue" />
                      </div>
                      <span className="text-white/80 text-[10px] font-bold">{plantsCount >= 5 ? t('profile.badgeFastSaver') : t('profile.badgeLocked')}</span>
                   </div>
                </div>
             </div>
          </GlowCard>

          <GlowCard>
             <div className="p-2">
                {[
                  { icon: User, label: t('profile.accountPrefs') },
                  { icon: Shield, label: t('profile.privacySecurity') },
                  { icon: Zap, label: t('profile.notificationSettings') },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/[0.04] transition-colors text-left border-none cursor-pointer group">
                    <item.icon className="w-5 h-5 text-white/50 group-hover:text-plant-500 transition-colors" />
                    <span className="text-white/80 text-sm font-medium">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
                  </button>
                ))}
                
                <div className="h-px bg-white/5 my-2 mx-4" />
                
                <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 transition-colors text-left border-none cursor-pointer group">
                  <LogOut className="w-5 h-5 text-red-500/70 group-hover:text-red-500 transition-colors" />
                  <span className="text-red-500/80 text-sm font-medium group-hover:text-red-500">{t('profile.signOut')}</span>
                </button>
             </div>
          </GlowCard>
        </div>

        {/* Right Col: Leaderboard & History */}
        <div className="lg:col-span-2 space-y-6">
          <GlowCard glowColor="rgba(0,230,118,0.15)">
            <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="font-display font-semibold text-white/90 text-lg flex items-center gap-2"><Leaf className="w-5 h-5 text-plant-500" /> {t('profile.leaderboard')}</h3>
                   <span className="text-white/40 text-xs font-semibold">{t('profile.weekly')}</span>
               </div>

               <div className="space-y-2">
                 {leaderboard.map((user) => (
                   <div key={user.rank} className={`flex items-center gap-4 p-3 rounded-xl border ${user.isMe ? 'bg-plant-500/10 border-plant-500/30' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04]'}`}>
                     <div className={`w-8 text-center font-display font-bold ${user.rank === 1 ? 'text-yellow-500 text-lg' : user.rank === 2 ? 'text-gray-300' : user.rank === 3 ? 'text-amber-600' : 'text-white/40'}`}>
                       #{user.rank}
                     </div>
                     <div className="flex-1">
                       <span className="text-white/90 font-medium">{user.name}</span>
                       {user.isMe && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-plant-500 text-surface-900">{t('profile.you')}</span>}
                     </div>
                     <div className="flex items-center gap-1.5">
                       <span className="text-white/90 font-display font-bold text-lg">{user.points}</span>
                       <Leaf className="w-3 h-3 text-plant-500" />
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </GlowCard>

          <GlowCard>
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="font-display font-semibold text-white/90 text-lg flex items-center gap-2"><History className="w-5 h-5 text-aurora-teal" /> {t('profile.recentActivity')}</h3>
               </div>
               
               <div className="space-y-4">
                 {gardenPlants.length > 0 ? gardenPlants.slice(0, 3).map((plant, i) => (
                   <div key={i} className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                       <CheckCircle2 className="w-4 h-4 text-white/50" />
                     </div>
                     <div className="flex-1">
                       <p className="text-white/80 text-sm leading-relaxed">
                         {t('profile.scanAction', { plant: language === 'hi' ? plant.nameHi || plant.nameEn : plant.nameEn })}
                       </p>
                       <p className="text-white/30 text-xs mt-1">{plant.scanDate}</p>
                     </div>
                     <div className="text-plant-500 font-bold text-sm">
                       {t('profile.pointsPrefix', { val: '150' })}
                     </div>
                   </div>
                 )) : (
                   <div className="text-center py-8 text-white/40 text-sm">{t('profile.noActivity')}</div>
                 )}
               </div>
            </div>
          </GlowCard>
        </div>

      </div>
    </div>
  );
}
