'use client';

import React, { useState } from 'react';
import { WaterState } from '@/lib/types';
import { getTodayString, getLast7Days } from '@/lib/storage';
import { sounds, triggerVibration } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Droplet,
  RotateCcw,
  Volume2,
  VolumeX,
  Vibrate,
  Clock,
  Award,
  ChevronDown,
  Calculator,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface WaterHabitProps {
  waterState: WaterState;
  onUpdate: (updater: (prev: WaterState) => WaterState) => void;
}

export function WaterHabit({ waterState, onUpdate }: WaterHabitProps) {
  const [selectedGlassMl, setSelectedGlassMl] = useState<number>(250);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showRecalculate, setShowRecalculate] = useState<boolean>(false);
  const [inputWeight, setInputWeight] = useState<string>(String(waterState.weightKg || 70));
  const [calcSuccessMsg, setCalcSuccessMsg] = useState<string | null>(null);
  const [newTime, setNewTime] = useState<string>('09:00');

  const percent = Math.min(
    100,
    Math.round((waterState.consumedMl / Math.max(1, waterState.dailyGoalMl)) * 100)
  );
  const isGoalReached = waterState.consumedMl >= waterState.dailyGoalMl;

  // Add water
  const handleDrink = (amount: number) => {
    onUpdate((prev) => {
      const nextAmount = prev.consumedMl + amount;
      return {
        ...prev,
        consumedMl: nextAmount,
      };
    });

    if (waterState.soundEnabled) {
      sounds.playWaterDrop();
    }
    if (waterState.vibrationEnabled) {
      triggerVibration([80, 50, 80]);
    }

    // Goal reached celebration
    if (waterState.consumedMl + amount >= waterState.dailyGoalMl && !isGoalReached) {
      sounds.playGoalCelebration();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd'],
      });
    }
  };

  // Undo last sip
  const handleUndo = () => {
    onUpdate((prev) => ({
      ...prev,
      consumedMl: Math.max(0, prev.consumedMl - selectedGlassMl),
    }));
  };

  // Calculate goal by weight
  const handleSaveWeight = (e?: React.FormEvent, customKg?: number) => {
    if (e) e.preventDefault();
    const kg = customKg !== undefined ? customKg : parseFloat(inputWeight);
    if (!isNaN(kg) && kg >= 20 && kg <= 300) {
      // 35 ml per kg is the standard medical recommendation
      const newGoal = Math.round(kg * 35);
      setInputWeight(String(kg));
      onUpdate((prev) => ({
        ...prev,
        weightKg: kg,
        dailyGoalMl: newGoal,
      }));
      sounds.playWaterDrop();
      triggerVibration([80, 50, 80]);
      setCalcSuccessMsg(`Meta recalculada: ${newGoal.toLocaleString('pt-BR')} ml/dia (${kg} kg) ✨`);
      setTimeout(() => setCalcSuccessMsg(null), 4000);
    }
  };

  // Add reminder time
  const handleAddTime = () => {
    if (!newTime || waterState.reminderTimes.includes(newTime)) return;
    const sorted = [...waterState.reminderTimes, newTime].sort();
    onUpdate((prev) => ({ ...prev, reminderTimes: sorted }));
  };

  // Remove reminder time
  const handleRemoveTime = (timeToRemove: string) => {
    onUpdate((prev) => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((t) => t !== timeToRemove),
    }));
  };

  // Generate spaced times (every 2.5 hours)
  const handleGenerateDefaultTimes = () => {
    const defaultTimes = ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'];
    onUpdate((prev) => ({ ...prev, reminderTimes: defaultTimes }));
  };

  // Test sound
  const handleTestSound = () => {
    sounds.playWaterDrop();
    triggerVibration([100, 60, 100]);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Top Hero: Animated Flask & Metric */}
      <div className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-900/90 p-6 rounded-3xl border-2 border-sky-100 dark:border-slate-800 shadow-sm text-center transition-colors">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-2xl pointer-events-none" />

        {/* Visual Water Bottle / Glass Container */}
        <div className="relative mx-auto w-36 h-52 bg-white/90 dark:bg-slate-800/90 rounded-3xl p-2.5 border-4 border-sky-300 dark:border-sky-600 shadow-md flex flex-col justify-end overflow-hidden mb-4">
          {/* Measurement marks */}
          <div className="absolute top-4 right-3 text-[10px] font-bold text-sky-400 select-none">
            100%
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-3 text-[10px] font-bold text-sky-400 select-none">
            50%
          </div>
          <div className="absolute bottom-4 right-3 text-[10px] font-bold text-sky-400 select-none">
            0%
          </div>
          <div className="absolute inset-y-0 right-7 w-px border-r border-dashed border-sky-200 dark:border-sky-700" />

          {/* Liquid level */}
          <div
            className="w-full bg-gradient-to-t from-sky-500 to-sky-400 rounded-2xl transition-all duration-700 ease-out relative flex items-center justify-center shadow-inner overflow-hidden"
            style={{ height: `${Math.max(12, percent)}%` }}
          >
            {/* Water shine wave */}
            <div className="absolute inset-0 bg-white/15 animate-pulse" />
            <div className="absolute top-1 left-2 w-8 h-1 bg-white/40 rounded-full" />
            <span className="text-white font-black text-sm drop-shadow-xs relative z-10">
              {percent}%
            </span>
          </div>
        </div>

        {/* Numbers */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
              <span className="text-sky-600 dark:text-sky-400">
                {waterState.consumedMl.toLocaleString('pt-BR')}
              </span>
              <span className="text-slate-400 text-xl font-bold">/</span>
              <span className="text-slate-700 dark:text-slate-300 text-2xl font-bold">
                {waterState.dailyGoalMl.toLocaleString('pt-BR')} ml
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRecalculate((prev) => !prev)}
              className="p-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition cursor-pointer shadow-2xs"
              title="Recalcular Meta de Água"
              aria-label="Recalcular Meta de Água"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isGoalReached
              ? '🎉 Parabéns! Meta de água alcançada com sucesso!'
              : `Faltam ${Math.max(
                  0,
                  waterState.dailyGoalMl - waterState.consumedMl
                ).toLocaleString('pt-BR')} ml para sua meta de hoje`}
          </p>

          {/* Botão para Recalcular Meta na tela do print */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setShowRecalculate((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                showRecalculate
                  ? 'bg-sky-600 text-white shadow-sky-500/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{showRecalculate ? 'Fechar Calculadora' : 'Recalcular Meta de Água'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showRecalculate ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Painel da Função Recalcular Meta transferida para a tela do print */}
        {showRecalculate && (
          <div className="mt-4 pt-4 border-t border-sky-100 dark:border-slate-800 text-left space-y-3 animate-fade-in bg-white/90 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Recalcular Meta por Peso Corporal
              </span>
              <span className="text-[10px] font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Padrão: 35 ml / kg
              </span>
            </div>

            <form
              onSubmit={(e) => handleSaveWeight(e)}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Seu peso corporal (kg):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="20"
                      max="250"
                      step="0.5"
                      value={inputWeight}
                      onChange={(e) => setInputWeight(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-none focus:border-sky-500"
                      placeholder="Ex: 70"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      kg
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                  >
                    Recalcular
                  </button>
                </div>
              </div>

            </form>

            {calcSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{calcSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Motivational message upon goal completion */}
        {isGoalReached && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold animate-bounce-subtle">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Seu corpo agradece pela hidratação hoje! Continue assim! ✨</span>
          </div>
        )}
      </div>

      {/* Main Action: "Já bebi!" with portion selectors */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Droplet className="w-4 h-4 text-sky-500" />
          Escolha o tamanho do copo:
        </h3>

        {/* Glass size pills */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { ml: 200, label: 'Copo pequeno', icon: '🥛' },
            { ml: 300, label: 'Copo grande', icon: '🥤' },
            { ml: 500, label: 'Garrafinha', icon: '🍶' },
          ].map((item) => (
            <button
              key={item.ml}
              type="button"
              onClick={() => setSelectedGlassMl(item.ml)}
              className={`p-3 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
                selectedGlassMl === item.ml
                  ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-sm font-black">{item.ml} ml</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Big Action Button "Já BEBI!" */}
        <button
          type="button"
          onClick={() => handleDrink(selectedGlassMl)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Droplet className="w-6 h-6 fill-white" />
          Já bebi! (+{selectedGlassMl} ml)
        </button>

        {/* Undo Button */}
        {waterState.consumedMl > 0 && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Desfazer último copo (-{selectedGlassMl} ml)
            </button>
          </div>
        )}
      </div>

      {/* Histórico dos Últimos 7 Dias de Água */}
      {(() => {
        const todayStr = getTodayString();
        const last7Days = getLast7Days();
        const chronologicalDays = [...last7Days].reverse();
        let daysMetGoal = 0;

        const daysData = chronologicalDays.map((day) => {
          const isToday = day.dateStr === todayStr;
          let amount = 0;
          let goal = waterState.dailyGoalMl;

          if (isToday) {
            amount = waterState.consumedMl;
            goal = waterState.dailyGoalMl;
          } else {
            const entry = waterState.history.find((h) => h.date === day.dateStr);
            if (entry) {
              amount = entry.amountMl;
              goal = entry.goalMl || waterState.dailyGoalMl;
            }
          }

          const percent = Math.min(100, Math.round((amount / Math.max(1, goal)) * 100));
          const isGoalMet = amount >= goal;
          if (isGoalMet) daysMetGoal++;

          return {
            ...day,
            isToday,
            amount,
            goal,
            percent,
            isGoalMet,
          };
        });

        return (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    Evolução dos Últimos 7 Dias
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sua constância de hidratação dia a dia
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                {daysMetGoal} de 7 metas batidas ✨
              </span>
            </div>

            {/* Visual 7-Day Bars */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
              {daysData.map((d) => (
                <div
                  key={d.dateStr}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition ${
                    d.isToday
                      ? 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/50 shadow-xs ring-1 ring-sky-300'
                      : d.isGoalMet
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                  title={`${d.label} (${d.weekdayName}): ${d.amount.toLocaleString('pt-BR')} ml de ${d.goal.toLocaleString('pt-BR')} ml (${d.percent}%)`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                    {d.dayShort}
                  </span>

                  {/* Vertical mini progress bar */}
                  <div className="w-full h-16 bg-white dark:bg-slate-800 rounded-xl overflow-hidden p-0.5 flex flex-col justify-end border border-slate-200 dark:border-slate-700 mb-1">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        d.isGoalMet
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-t from-sky-500 to-sky-400'
                      }`}
                      style={{ height: `${Math.max(6, d.percent)}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-black leading-tight">
                    {d.isGoalMet ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ Meta</span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">{d.percent}%</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-0.5 ${
                      d.isToday ? 'text-sky-700 dark:text-sky-400 font-black underline' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Settings / Weight & Reminders Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold">
              <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Horários de lembretes e avisos sonoros
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {waterState.reminderTimes.length} horários programados • Som e vibração
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${
              showConfig ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showConfig && (
          <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-5">

            {/* Reminder Times */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Horários dos lembretes ({waterState.reminderTimes.length}):
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDefaultTimes}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Usar sugestão padrão
                </button>
              </div>

              {/* Time chips */}
              <div className="flex flex-wrap gap-2">
                {waterState.reminderTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 rounded-xl text-xs font-bold"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(t)}
                      className="text-sky-400 hover:text-red-500 transition cursor-pointer"
                      title="Remover horário"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add custom time */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    + Adicionar horário
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>👆</span> Click no relógio
                </span>
              </div>
            </div>

            {/* Sound & Vibration toggles */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Avisos sonoros e vibração
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      soundEnabled: !prev.soundEnabled,
                    }))
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    waterState.soundEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {waterState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  Som: {waterState.soundEnabled ? 'Ligado' : 'Desligado'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      vibrationEnabled: !prev.vibrationEnabled,
                    }))
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                    waterState.vibrationEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Vibrate className="w-4 h-4" />
                  Vibração: {waterState.vibrationEnabled ? 'Ligada' : 'Desligada'}
                </button>
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900 transition cursor-pointer"
                >
                  Testar som 🔊
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
