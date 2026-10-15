'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HabitTab, WaterState, MedicineState } from '@/lib/types';
import { useAppData, getTodayString } from '@/lib/storage';
import {
  checkActiveAlerts,
  ActiveAlert,
  triggerAlertEffects,
  sendBrowserNotification,
  hasNotificationPermission,
} from '@/lib/notifications';
import { Header } from '@/components/Header';
import { HomeScreen } from '@/components/HomeScreen';
import { WaterHabit } from '@/components/WaterHabit';
import { MedicineHabit } from '@/components/MedicineHabit';
import { EvolutionScreen } from '@/components/EvolutionScreen';
import { AboutModal } from '@/components/AboutModal';
import { ActiveAlertBanner } from '@/components/ActiveAlertBanner';
import { InstallAppModal } from '@/components/InstallAppModal';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';

export default function Page() {
  const [data, updateData] = useAppData();
  const [currentTab, setCurrentTab] = useState<HabitTab>('home');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    hasNotificationPermission()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const alertedSetRef = useRef<Set<string>>(new Set());

  // Listen to connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize document dark class and color-scheme for Branco and Dark modes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark = data?.settings?.theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    }
  }, [data?.settings?.theme]);

  // Specific state updaters
  const updateWater = (updater: (prev: WaterState) => WaterState) => {
    updateData((prev) => ({ ...prev, water: updater(prev.water) }));
  };

  const updateMedicine = (updater: (prev: MedicineState) => MedicineState) => {
    updateData((prev) => ({ ...prev, medicine: updater(prev.medicine) }));
  };

  // Periodic alarm verification
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const todayStr = getTodayString();
      const currentAlerts = checkActiveAlerts(data, todayStr);
      for (const alert of currentAlerts) {
        if (!alertedSetRef.current.has(alert.id)) {
          alertedSetRef.current.add(alert.id);
          setActiveAlert(alert);
          triggerAlertEffects(alert.type);
          sendBrowserNotification(alert.title, alert.message);
          break;
        }
      }
    }, 20000); // Check every 20 seconds
    return () => clearInterval(interval);
  }, [data]);

  // Quick drink 250ml
  const handleQuickDrinkWater = (amountMl: number) => {
    updateWater((prev) => ({
      ...prev,
      consumedMl: prev.consumedMl + amountMl,
    }));
  };

  // Confirm active alert action
  const handleConfirmAlertAction = (alert: ActiveAlert) => {
    const todayStr = getTodayString();
    if (alert.type === 'water') {
      handleQuickDrinkWater(250);
    } else if (alert.type === 'medicine' && alert.medicineId) {
      const now = new Date();
      const currentClock = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      updateMedicine((prev) => ({
        ...prev,
        medicines: prev.medicines.map((m) => {
          if (m.id !== alert.medicineId) return m;
          return {
            ...m,
            history: [
              ...m.history.filter(
                (h) => !(h.date === todayStr && h.time === alert.time)
              ),
              { date: todayStr, time: alert.time, takenAt: currentClock },
            ],
          };
        }),
      }));
    }
    setActiveAlert(null);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center animate-spin text-sky-600">
            ⏳
          </div>
          <p className="text-sm font-bold text-slate-600">Carregando Lembragua.online...</p>
        </div>
      </div>
    );
  }

  const theme = data.settings?.theme || 'light';

  const handleToggleTheme = () => {
    updateData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings?.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  return (
    <div
      className={
        theme === 'dark'
          ? 'dark min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 transition-colors'
          : 'min-h-screen bg-slate-50/50 text-slate-800 flex flex-col selection:bg-sky-200 transition-colors'
      }
    >
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* Active Floating Alert (Alarm Simulator & Trigger) */}
      <ActiveAlertBanner
        alert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        onConfirmAction={handleConfirmAlertAction}
      />

      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed bottom-18 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-lg border border-slate-700">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Modo Offline: tudo salvo no aparelho.</span>
        </div>
      )}

      {/* Modal for App Download / Installation with Icon */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Main Content Area with Smooth Page Transitions */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentTab === 'home' && (
              <HomeScreen
                data={data}
                onSelectTab={setCurrentTab}
                onQuickDrinkWater={handleQuickDrinkWater}
                onOpenInstall={() => setIsInstallModalOpen(true)}
              />
            )}
            {currentTab === 'water' && (
              <WaterHabit waterState={data.water} onUpdate={updateWater} />
            )}
            {currentTab === 'medicine' && (
              <MedicineHabit
                medicineState={data.medicine}
                onUpdate={updateMedicine}
              />
            )}
            {currentTab === 'evolution' && (
              <EvolutionScreen
                data={data}
                onUpdateWater={updateWater}
                onUpdateMedicine={updateMedicine}
              />
            )}
            {currentTab === 'about' && (
              <AboutModal
                appData={data}
                onRestoreData={(newData) => {
                  updateData(() => newData);
                }}
                onClose={() => setCurrentTab('home')}
                onSetTheme={(t) => {
                  updateData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, theme: t },
                  }));
                }}
                onOpenInstall={() => setIsInstallModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Quick Navigation Bar (always 1 tap away) */}
      <nav className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-md transition-colors">
        <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around gap-1">
          {/* Home */}
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'home'
                ? 'text-sky-600 dark:text-sky-400 font-black bg-sky-50 dark:bg-sky-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold">Início</span>
          </button>

          {/* Water */}
          <button
            type="button"
            onClick={() => setCurrentTab('water')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'water'
                ? 'text-sky-600 dark:text-sky-400 font-black bg-sky-50 dark:bg-sky-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">💧</span>
            <span className="text-xs font-bold">Água</span>
          </button>

          {/* Medicine */}
          <button
            type="button"
            onClick={() => setCurrentTab('medicine')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'medicine'
                ? 'text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">💊</span>
            <span className="text-xs font-bold">Remédios</span>
          </button>

          {/* Evolution */}
          <button
            type="button"
            onClick={() => setCurrentTab('evolution')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'evolution'
                ? 'text-teal-600 dark:text-teal-400 font-black bg-teal-50 dark:bg-teal-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-xl">📈</span>
            <span className="text-xs font-bold">Evolução</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
