import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User, Bell, Shield, Palette, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    name: user?.name || 'Trader',
    email: user?.email || 'demo@tradient.ai',
    riskPerTrade: '1.5',
    maxDailyLoss: '3.0',
    newsAlerts: true,
    tradeAlerts: true,
    disciplineAlerts: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Profile</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
            <input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
            <input value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
        </div>
      </motion.div>

      {/* Risk Management */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Risk Management</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Risk Per Trade (%)</label>
            <input value={settings.riskPerTrade} onChange={e => setSettings({ ...settings, riskPerTrade: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Daily Loss (%)</label>
            <input value={settings.maxDailyLoss} onChange={e => setSettings({ ...settings, maxDailyLoss: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'newsAlerts', label: 'News Impact Alerts' },
            { key: 'tradeAlerts', label: 'Trade Execution Alerts' },
            { key: 'disciplineAlerts', label: 'Discipline Warnings' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
              <span className="text-sm">{item.label}</span>
              <div
                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${settings[item.key as keyof typeof settings] ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${settings[item.key as keyof typeof settings] ? 'left-5' : 'left-1'}`} />
              </div>
            </label>
          ))}
        </div>
      </motion.div>

      <button onClick={handleSave} className="flex items-center gap-2 px-6 h-10 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
