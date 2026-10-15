'use client';

import React, { useState } from 'react';
import {
  MotivationalQuote,
  getDailyMotivationalQuote,
  getRandomMotivationalQuote,
} from '@/lib/motivation';
import { getTodayString } from '@/lib/storage';
import { Sparkles, RefreshCw, Copy, Check, Quote, Heart } from 'lucide-react';
import { sounds, triggerVibration } from '@/lib/sound';

interface DailyMotivationCardProps {
  className?: string;
}

export function DailyMotivationCard({ className = '' }: DailyMotivationCardProps) {
  const todayStr = getTodayString();
  const [quote, setQuote] = useState<MotivationalQuote>(() =>
    getDailyMotivationalQuote(todayStr)
  );
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Format today's date in full Portuguese (ex: "Quarta-feira, 14 de outubro")
  const getFormattedDateDisplay = () => {
    try {
      const d = new Date();
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return 'Hoje';
    }
  };

  const handleShuffleQuote = () => {
    setIsRotating(true);
    triggerVibration([60, 40]);
    sounds.playWaterDrop();
    const newQuote = getRandomMotivationalQuote(quote.id);
    setQuote(newQuote);
    setTimeout(() => {
      setIsRotating(false);
    }, 400);
  };

  const handleCopyQuote = async () => {
    try {
      const textToCopy = `"${quote.phrase}" — ${quote.author}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      triggerVibration([80]);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-rose-50/60 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border-2 border-amber-200/80 dark:border-amber-900/40 p-5 sm:p-6 shadow-sm transition-all ${className}`}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200/40 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Date & Badge */}
      <div className="relative flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400/20 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-500" />
          </span>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Frase de Motivação de Hoje
            </span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
              {getFormattedDateDisplay()}
            </p>
          </div>
        </div>

        {/* Category tag */}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
          <span>{quote.icon}</span>
          <span className="capitalize">{quote.category}</span>
        </span>
      </div>

      {/* Motivational Phrase Body */}
      <div className="relative my-2 sm:my-3">
        <Quote className="w-6 h-6 text-amber-300 dark:text-amber-700/60 mb-1" />
        <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug pl-1">
          {quote.phrase}
        </p>
      </div>

      {/* Footer: Author & Action Buttons */}
      <div className="relative mt-4 pt-3.5 border-t border-amber-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          {quote.author}
        </span>
        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopyQuote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Copiar frase motivacional"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span className="text-emerald-700 dark:text-emerald-400">Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar</span>
              </>
            )}
          </button>

          {/* New quote button */}
          <button
            type="button"
            onClick={handleShuffleQuote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Ver outra frase motivacional"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`}
            />
            <span>Outra Frase</span>
          </button>
        </div>
      </div>
    </div>
  );
}
