'use client';

import React, { useState } from 'react';
import { WaterState } from '@/lib/types';
import { Calculator, CheckCircle2, Sparkles } from 'lucide-react';
import { sounds, triggerVibration } from '@/lib/sound';

interface GoalCalculatorCardProps {
  waterState: WaterState;
  onUpdateWater: (updater: (prev: WaterState) => WaterState) => void;
  title?: string;
  subtitle?: string;
}

export function GoalCalculatorCard({
  waterState,
  onUpdateWater,
  title = 'Informar Peso e Calcular a Meta',
  subtitle = 'Recomendação médica padrão: 35 ml por kg de peso corporal',
}: GoalCalculatorCardProps) {
  const [inputWeight, setInputWeight] = useState<string>(() =>
    waterState.weightKg ? String(waterState.weightKg) : '70'
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCalculateGoal = (weightToUse?: number) => {
    const rawKg = weightToUse !== undefined ? weightToUse : parseFloat(inputWeight);
    if (!isNaN(rawKg) && rawKg >= 20 && rawKg <= 300) {
      const newGoal = Math.round(rawKg * 35);
      onUpdateWater((prev) => ({
        ...prev,
        weightKg: rawKg,
        dailyGoalMl: newGoal,
      }));
      sounds.playWaterDrop();
      triggerVibration([80, 50, 80]);
      setSuccessMsg(`Meta recalculada para ${newGoal.toLocaleString('pt-BR')} ml/dia com sucesso! 💧`);
      setTimeout(() => setSuccessMsg(null), 4500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCalculateGoal();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-100 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Calculator className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs">
          Meta atual: {waterState.dailyGoalMl.toLocaleString('pt-BR')} ml
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Informe seu peso corporal (kg) para calcular a meta diária:
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="number"
                min="25"
                max="250"
                step="0.5"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-base bg-white dark:bg-slate-800 focus:outline-none focus:border-sky-500 transition shadow-inner"
                placeholder="Ex: 70"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                kg
              </span>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Calcular Meta
            </button>
          </div>
        </div>


        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
