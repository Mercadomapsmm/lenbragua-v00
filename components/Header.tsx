'use client';

import React from 'react';
import { ArrowLeft, Bell, BellOff, Info, Sun, Moon } from 'lucide-react';
import { HabitTab } from '@/lib/types';
import { requestNotificationPermission } from '@/lib/notifications';
import { Logo } from '@/components/Logo';

interface HeaderProps {
  currentTab: HabitTab;
  onSelectTab: (tab: HabitTab) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  currentTab,
  onSelectTab,
  notificationsEnabled,
  onToggleNotifications,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const handleNotificationClick = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        onToggleNotifications();
      } else {
        onToggleNotifications();
      }
    } else {
      onToggleNotifications();
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'water':
        return { title: 'Lembrete de Água', subtitle: 'Hidratação e Saúde', icon: '💧' };
      case 'medicine':
        return { title: 'Lembrete de Remédio', subtitle: 'Doses e Horários Certos', icon: '💊' };
      case 'evolution':
        return { title: 'Tela da Evolução', subtitle: 'Metas e Histórico dos 7 Dias', icon: '📈' };
      case 'about':
        return { title: 'Sobre o App', subtitle: 'Versão 1.0.0 • 100% Offline', icon: 'ℹ️' };
      default:
        return { title: 'Lembragua.online', subtitle: 'Cuidado diário sem complicação', icon: null };
    }
  };

  const tabInfo = getTabTitle();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {currentTab !== 'home' ? (
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition active:scale-95 cursor-pointer"
              aria-label="Voltar para o início"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">Início</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <Logo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
                  Lembragua.online
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Offline e seguro" />
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Leve • Sem cadastro • 100% Offline
                </p>
              </div>
            </div>
          )}

          {currentTab !== 'home' && (
            <div className="hidden sm:block">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{tabInfo.icon}</span> {tabInfo.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tabInfo.subtitle}</p>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle, Notifications, About */}
        <div className="flex items-center gap-2">
          {/* Duas opções para a cor da tela: Branco e Dark */}
          <div
            className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
            role="group"
            aria-label="Opções para a cor da tela: Branco e Dark"
          >
            <button
              type="button"
              onClick={() => {
                if (theme !== 'light') onToggleTheme();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Tela na cor Branca (Clara)"
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>Branco</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (theme !== 'dark') onToggleTheme();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-amber-300 shadow-xs ring-1 ring-slate-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tela na cor Dark (Noturna)"
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>Dark</span>
            </button>
          </div>

          {/* Notification Button */}
          <button
            onClick={handleNotificationClick}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
            }`}
            title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
            aria-label="Controle de notificações"
          >
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* About / Settings Modal */}
          <button
            onClick={() => onSelectTab('about')}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              currentTab === 'about'
                ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Sobre o app"
            aria-label="Sobre o app"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
