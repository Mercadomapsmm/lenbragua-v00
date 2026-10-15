'use client';

import React from 'react';
import { HabitTab, AppData } from '@/lib/types';
import { getTodayString } from '@/lib/storage';
import {
  Droplet,
  Pill,
  CheckCircle2,
  ChevronRight,
  Plus,
  Sparkles,
  ShieldCheck,
  Download,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds, triggerVibration } from '@/lib/sound';
import { Logo } from '@/components/Logo';

interface HomeScreenProps {
  data: AppData;
  onSelectTab: (tab: HabitTab) => void;
  onQuickDrinkWater: (amountMl: number) => void;
  onOpenInstall?: () => void;
}

export function HomeScreen({
  data,
  onSelectTab,
  onQuickDrinkWater,
  onOpenInstall,
}: HomeScreenProps) {
  const todayStr = getTodayString();

  // Water calculation
  const waterPercent = Math.min(
    100,
    Math.round((data.water.consumedMl / Math.max(1, data.water.dailyGoalMl)) * 100)
  );
  const waterDone = data.water.consumedMl >= data.water.dailyGoalMl;

  // Medicine status: check how many doses left today
  let totalDosesToday = 0;
  let takenDosesToday = 0;
  const currentDayOfWeek = new Date().getDay();

  data.medicine.medicines.forEach((med) => {
    // Check if scheduled for current day of week
    if (
      med.frequency === 'specific_days' &&
      med.specificDays &&
      med.specificDays.length > 0 &&
      !med.specificDays.includes(currentDayOfWeek)
    ) {
      return;
    }
    med.times.forEach((t) => {
      totalDosesToday++;
      const taken = med.history.some((h) => h.date === todayStr && h.time === t);
      if (taken) takenDosesToday++;
    });
  });

  const allMedsDone = totalDosesToday > 0 ? takenDosesToday >= totalDosesToday : true;

  // Overall daily score: 0 to 2
  const maxHabits = totalDosesToday > 0 ? 2 : 1;
  const completedHabitsCount =
    (waterDone ? 1 : 0) + (totalDosesToday > 0 && allMedsDone ? 1 : 0);

  // Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Olá!';
  let greetingIcon = '☀️';
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Bom dia!';
    greetingIcon = '🌅';
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde!';
    greetingIcon = '☀️';
  } else {
    greeting = 'Boa noite!';
    greetingIcon = '🌙';
  }

  // Quick drink handler with feedback
  const handleQuickDrink = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickDrinkWater(250);
    sounds.playWaterDrop();
    triggerVibration([80, 50, 80]);
    if (data.water.consumedMl + 250 >= data.water.dailyGoalMl && !waterDone) {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      sounds.playGoalCelebration();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Friendly Hero Banner */}
      <div className="bg-gradient-to-br from-sky-50 via-teal-50/50 to-amber-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-5 rounded-3xl border border-sky-100/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{greetingIcon}</span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {greeting}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Offline
          </span>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Cuidar de você é simples. Dê 1 toque para ver ou marcar seus hábitos de hoje.
        </p>

        {/* Daily progress meter */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Seu Dia Saudável
            </span>
            <span className="text-sky-700 dark:text-sky-400 font-extrabold">
              {completedHabitsCount} de {maxHabits} hábitos em dia
            </span>
          </div>
          <div className="w-full h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(completedHabitsCount / maxHabits) * 100}%` }}
            />
          </div>
        </div>
      </div>


      {/* Install / Download App Banner */}
      {onOpenInstall && (
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenInstall}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenInstall()}
          className="p-4 rounded-3xl bg-gradient-to-r from-sky-50 via-teal-50/50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-sky-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <Logo className="w-12 h-12 group-hover:scale-105 transition" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 dark:text-white text-sm truncate">
                  Baixar App com Ícone
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  Instalar no Celular
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Adicione o Lembragua na tela inicial ou baixe arquivos e ícones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 px-3 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs group-hover:scale-105 transition">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar</span>
          </div>
        </div>
      )}

      {/* 2 Big Cards - 1 Tap Away (Water and Medicine) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1º WATER CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectTab('water')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectTab('water')}
          className="group relative text-left p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
        >
          {/* Card Top */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-inner group-hover:bg-sky-200 transition">
                <Droplet className="w-8 h-8 fill-sky-500 stroke-sky-600" />
              </div>
              {waterDone ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Meta Atingida!
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                  {waterPercent}%
                </span>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition">
              1. Beber Água
            </h3>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Meta: {data.water.dailyGoalMl.toLocaleString('pt-BR')} ml por dia
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTab('evolution');
                }}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Ver tela de evolução"
              >
                Evolução →
              </button>
            </div>

            {/* Visual water level bar */}
            <div className="mt-3.5 space-y-1">
              <div className="w-full h-3 bg-sky-50 dark:bg-slate-800 rounded-full overflow-hidden border border-sky-100 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 pt-0.5">
                <span>{data.water.consumedMl.toLocaleString('pt-BR')} ml</span>
                <span className="text-slate-400 dark:text-slate-500">
                  falta {Math.max(0, data.water.dailyGoalMl - data.water.consumedMl)} ml
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleQuickDrink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Registrar um copo d'água agora"
            >
              <Plus className="w-3.5 h-3.5" />
              + 250 ml agora
            </button>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center group-hover:translate-x-1 transition">
              Abrir <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
        </div>

        {/* 2º MEDICINE CARD */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectTab('medicine')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectTab('medicine')}
          className="group relative text-left p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner group-hover:bg-amber-200 transition">
                <Pill className="w-8 h-8 fill-amber-300 stroke-amber-600" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {data.medicine.medicines.length} cadastrado(s)
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition">
              2. Remédios
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Horários regulares • Aviso até confirmar
            </p>

            <div className="mt-3.5 p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Doses de hoje:</span>
              <span className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                {totalDosesToday > 0
                  ? `${takenDosesToday} de ${totalDosesToday} tomadas`
                  : 'Nenhum programado'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
              {allMedsDone ? 'Tudo em dia! ✨' : 'Doses pendentes ⏰'}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center group-hover:translate-x-1 transition">
              Abrir <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
