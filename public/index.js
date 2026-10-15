/**
 * Lembragua.online - Aplicação Web Standalone
 * 100% Offline • Sem cadastro • Leve e Rápido
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'habitos_simples_v1';

  // --- Web Audio & Sound Synthesizer (Zero External Dependencies) ---
  const soundContext = {
    ctx: null,
    init() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playWaterDrop() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    },
    playGoalCelebration() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = now + idx * 0.1;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.38);
        });
      } catch (e) {
        console.warn('Celebration audio error:', e);
      }
    },
  };

  function triggerVibration(pattern) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern || [80, 50, 80]);
      } catch (e) {
        // ignore
      }
    }
  }

  function triggerConfetti() {
    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#0284c7', '#38bdf8', '#10b981', '#f59e0b'],
      });
    }
  }

  // --- Dates and Formatting Utilities ---
  function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getLast7Days() {
    const days = [];
    const now = new Date();
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayShorts = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      let label = `${day}/${month}`;
      if (i === 0) label = 'Hoje';
      else if (i === 1) label = 'Ontem';

      days.push({
        dateStr,
        label,
        dayShort: dayShorts[d.getDay()],
        weekdayName: weekdayNames[d.getDay()],
        dayNumber: d.getDay(),
      });
    }
    return days;
  }

  // --- Initial Data Defaults ---
  const defaultInitialData = {
    water: {
      weightKg: 70,
      dailyGoalMl: 2450,
      consumedMl: 0,
      reminderTimes: ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'],
      soundEnabled: true,
      vibrationEnabled: true,
      lastUpdatedDate: getTodayString(),
      history: [],
    },
    medicine: {
      medicines: [
        {
          id: 'med-1',
          name: 'Vitamina D / Cálcio',
          dosage: '1 comprimido',
          times: ['08:00'],
          frequency: 'daily',
          notes: 'Tomar junto ao café da manhã com água',
          color: '#0284c7',
          history: [],
        },
        {
          id: 'med-2',
          name: 'Pressão / Protetor',
          dosage: '1 dose',
          times: ['20:00'],
          frequency: 'daily',
          notes: 'Não deitar imediatamente após tomar',
          color: '#7c3aed',
          history: [],
        },
      ],
      soundEnabled: true,
    },
    settings: {
      userName: '',
      notificationsAllowed: false,
      theme: 'light',
    },
  };

  // --- Application State Manager ---
  let appData = defaultInitialData;
  let currentTab = 'home'; // 'home' | 'water' | 'medicine' | 'evolution' | 'about'
  let selectedGlassMl = 250;
  let showWaterRecalculate = false;
  let showWaterReminders = false;
  let customWeightInput = '70';
  let calcSuccessMsg = null;
  let newWaterReminderTime = '09:00';
  let selectedWaterEvolutionDay = null;
  let customWaterEvolutionInput = '';
  let toastMessage = null;
  let toastTimeout = null;

  // Medicine screen state
  let isMedModalOpen = false;
  let editingMedId = null;
  let confirmingDeleteMedId = null;
  let selectedMedHistoryDayKey = null;

  // Medicine modal form fields
  let medFormName = '';
  let medFormDosage = '';
  let medFormTimes = [];
  let medFormTimeInput = '';
  let medFormFrequency = 'daily';
  let medFormIntervalHours = 8;
  let medFormSpecificDays = [1, 2, 3, 4, 5];
  let medFormNotes = '';
  let medFormColor = '#0284c7';

  function showToast(msg) {
    toastMessage = msg;
    if (toastTimeout) clearTimeout(toastTimeout);
    renderApp();
    toastTimeout = setTimeout(() => {
      toastMessage = null;
      renderApp();
    }, 3500);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        appData = defaultInitialData;
        saveData();
        return;
      }
      const parsed = JSON.parse(raw);
      const today = getTodayString();

      const water = {
        weightKg: typeof parsed.water?.weightKg === 'number' ? parsed.water.weightKg : 70,
        dailyGoalMl: typeof parsed.water?.dailyGoalMl === 'number' ? parsed.water.dailyGoalMl : 2450,
        consumedMl: typeof parsed.water?.consumedMl === 'number' ? parsed.water.consumedMl : 0,
        reminderTimes: Array.isArray(parsed.water?.reminderTimes)
          ? parsed.water.reminderTimes
          : defaultInitialData.water.reminderTimes,
        soundEnabled: parsed.water?.soundEnabled ?? true,
        vibrationEnabled: parsed.water?.vibrationEnabled ?? true,
        lastUpdatedDate: parsed.water?.lastUpdatedDate || today,
        history: Array.isArray(parsed.water?.history) ? parsed.water.history : [],
      };

      if (water.lastUpdatedDate !== today) {
        if (water.consumedMl > 0) {
          water.history.push({
            date: water.lastUpdatedDate,
            amountMl: water.consumedMl,
            goalMl: water.dailyGoalMl,
          });
        }
        water.consumedMl = 0;
        water.lastUpdatedDate = today;
      }

      const medicine = {
        medicines: Array.isArray(parsed.medicine?.medicines)
          ? parsed.medicine.medicines
          : defaultInitialData.medicine.medicines,
        soundEnabled: parsed.medicine?.soundEnabled ?? true,
      };

      const settings = {
        userName: parsed.settings?.userName || '',
        notificationsAllowed: parsed.settings?.notificationsAllowed ?? false,
        theme: parsed.settings?.theme === 'dark' ? 'dark' : 'light',
      };

      appData = { water, medicine, settings };
      customWeightInput = String(appData.water.weightKg || 70);
    } catch (e) {
      console.error('Error loading data:', e);
      appData = defaultInitialData;
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }

  function updateTheme() {
    const isDark = appData.settings?.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  // --- Rendering Functions ---
  function renderApp() {
    updateTheme();
    const root = document.getElementById('root');
    if (!root) return;

    const isDark = appData.settings?.theme === 'dark';

    root.innerHTML = `
      <div class="${isDark ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50/50 text-slate-800'} flex flex-col transition-colors selection:bg-sky-200">
        ${renderHeader()}
        ${toastMessage ? renderToast() : ''}
        <main class="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-6">
          <div class="animate-fade-in">
            ${
              currentTab === 'home'
                ? renderHomeScreen()
                : currentTab === 'water'
                ? renderWaterScreen()
                : currentTab === 'medicine'
                ? renderMedicineScreen()
                : currentTab === 'evolution'
                ? renderEvolutionScreen()
                : renderAboutScreen()
            }
          </div>
        </main>
        ${renderBottomNav()}
        ${isMedModalOpen ? renderMedicineModal() : ''}
      </div>
    `;

    attachEventListeners();
  }

  function renderHeader() {
    const isDark = appData.settings?.theme === 'dark';
    const isHome = currentTab === 'home';

    let title = 'Lembragua.online';
    let subtitle = 'Cuidado diário sem complicação';
    let icon = '';

    if (currentTab === 'water') {
      title = 'Lembrete de Água';
      subtitle = 'Hidratação e Saúde';
      icon = '💧';
    } else if (currentTab === 'medicine') {
      title = 'Lembrete de Remédio';
      subtitle = 'Doses e Horários Certos';
      icon = '💊';
    } else if (currentTab === 'evolution') {
      title = 'Tela da Evolução';
      subtitle = 'Metas e Histórico dos 7 Dias';
      icon = '📈';
    } else if (currentTab === 'about') {
      title = 'Sobre o App';
      subtitle = 'Versão 1.0.0 • 100% Offline';
      icon = 'ℹ️';
    }

    return `
      <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            ${
              !isHome
                ? `
                <button type="button" data-action="nav-home" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition cursor-pointer">
                  <span>←</span>
                  <span>Início</span>
                </button>
                <div class="hidden sm:block">
                  <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>${icon}</span> ${title}
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">${subtitle}</p>
                </div>
              `
                : `
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white text-xl font-black shadow-sm">
                    💧
                  </div>
                  <div>
                    <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
                      Lembragua.online
                      <span class="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Offline e seguro"></span>
                    </h1>
                    <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Leve • Sem cadastro • 100% Offline
                    </p>
                  </div>
                </div>
              `
            }
          </div>

          <div class="flex items-center gap-2">
            <!-- Branco e Dark Selector -->
            <div class="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button type="button" data-action="set-theme-light" class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                !isDark ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-200'
              }">
                <span>☀️</span>
                <span>Branco</span>
              </button>
              <button type="button" data-action="set-theme-dark" class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                isDark ? 'bg-slate-700 text-amber-300 shadow-xs ring-1 ring-slate-600' : 'text-slate-400 hover:text-slate-600'
              }">
                <span>🌙</span>
                <span>Dark</span>
              </button>
            </div>

            <!-- About Button -->
            <button type="button" data-action="nav-about" class="p-2 rounded-xl border transition cursor-pointer ${
              currentTab === 'about'
                ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }" title="Sobre o app">
              ℹ️
            </button>
          </div>
        </div>
      </header>
    `;
  }

  function renderToast() {
    return `
      <div class="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] p-3 bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
        <span class="text-emerald-600 dark:text-emerald-400 text-sm">✓</span>
        <span class="flex-1">${toastMessage}</span>
      </div>
    `;
  }

  function renderHomeScreen() {
    const todayStr = getTodayString();
    const waterPercent = Math.min(
      100,
      Math.round((appData.water.consumedMl / Math.max(1, appData.water.dailyGoalMl)) * 100)
    );
    const waterDone = appData.water.consumedMl >= appData.water.dailyGoalMl;

    let totalDosesToday = 0;
    let takenDosesToday = 0;
    const currentDayOfWeek = new Date().getDay();

    appData.medicine.medicines.forEach((med) => {
      if (
        med.frequency === 'specific_days' &&
        med.specificDays &&
        med.specificDays.length > 0 &&
        !med.specificDays.includes(currentDayOfWeek)
      ) {
        return;
      }
      (med.times || []).forEach((t) => {
        totalDosesToday++;
        const taken = (med.history || []).some((h) => h.date === todayStr && h.time === t);
        if (taken) takenDosesToday++;
      });
    });

    const allMedsDone = totalDosesToday > 0 ? takenDosesToday >= totalDosesToday : true;
    const maxHabits = totalDosesToday > 0 ? 2 : 1;
    const completedHabitsCount = (waterDone ? 1 : 0) + (totalDosesToday > 0 && allMedsDone ? 1 : 0);

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

    return `
      <div class="space-y-6 pb-12">
        <!-- Friendly Hero Banner -->
        <div class="bg-gradient-to-br from-sky-50 via-teal-50/50 to-amber-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-5 rounded-3xl border border-sky-100/80 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between gap-3 mb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${greetingIcon}</span>
              <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                ${greeting}
              </h2>
            </div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <span class="text-emerald-500">🛡️</span> 100% Offline
            </span>
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
            Cuidar de você é simples. Dê 1 toque para ver ou marcar seus hábitos de hoje.
          </p>

          <div class="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800">
            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
              <span class="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="text-amber-500">✨</span> Seu Dia Saudável
              </span>
              <span class="text-sky-700 dark:text-sky-400 font-extrabold">
                ${completedHabitsCount} de ${maxHabits} hábitos em dia
              </span>
            </div>
            <div class="w-full h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700 shadow-inner">
              <div
                class="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-700"
                style="width: ${(completedHabitsCount / maxHabits) * 100}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- 2 Big Cards - Water and Medicine -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 1º WATER CARD -->
          <div
            data-action="nav-water"
            class="group relative text-left p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 text-3xl shadow-inner group-hover:bg-sky-200 transition">
                  💧
                </div>
                ${
                  waterDone
                    ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        ✓ Meta Atingida!
                      </span>`
                    : `<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                        ${waterPercent}%
                      </span>`
                }
              </div>

              <h3 class="text-xl font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition">
                1. Beber Água
              </h3>
              <div class="flex items-center justify-between gap-2 mt-0.5">
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Meta: ${appData.water.dailyGoalMl.toLocaleString('pt-BR')} ml por dia
                </p>
                <button
                  type="button"
                  data-action="nav-evolution"
                  class="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Ver tela de evolução"
                >
                  Evolução →
                </button>
              </div>

              <!-- Visual progress bar -->
              <div class="mt-3.5 space-y-1">
                <div class="w-full h-3 bg-sky-50 dark:bg-slate-800 rounded-full overflow-hidden border border-sky-100 dark:border-slate-700">
                  <div
                    class="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                    style="width: ${waterPercent}%"
                  ></div>
                </div>
                <div class="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 pt-0.5">
                  <span>${appData.water.consumedMl.toLocaleString('pt-BR')} ml</span>
                  <span class="text-slate-400 dark:text-slate-500">
                    falta ${Math.max(0, appData.water.dailyGoalMl - appData.water.consumedMl)} ml
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Action Button -->
            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                data-action="quick-drink-250"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                title="Registrar um copo d'água agora"
              >
                + 250 ml agora
              </button>
              <span class="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center group-hover:translate-x-1 transition">
                Abrir →
              </span>
            </div>
          </div>

          <!-- 2º MEDICINE CARD -->
          <div
            data-action="nav-medicine"
            class="group relative text-left p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 text-3xl shadow-inner group-hover:bg-amber-200 transition">
                  💊
                </div>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ${appData.medicine.medicines.length} cadastrado(s)
                </span>
              </div>

              <h3 class="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                2. Remédios
              </h3>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Horários regulares • Aviso até confirmar
              </p>

              <div class="mt-3.5 p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Doses de hoje:</span>
                <span class="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  ${
                    totalDosesToday > 0
                      ? `${takenDosesToday} de ${totalDosesToday} tomadas`
                      : 'Nenhum programado'
                  }
                </span>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-amber-800 dark:text-amber-400">
                ${allMedsDone ? 'Tudo em dia! ✨' : 'Doses pendentes ⏰'}
              </span>
              <span class="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center group-hover:translate-x-1 transition">
                Abrir →
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderWaterScreen() {
    const percent = Math.min(
      100,
      Math.round((appData.water.consumedMl / Math.max(1, appData.water.dailyGoalMl)) * 100)
    );
    const isGoalReached = appData.water.consumedMl >= appData.water.dailyGoalMl;

    const todayStr = getTodayString();
    const last7Days = getLast7Days();
    const chronologicalDays = [...last7Days].reverse();
    let daysMetGoal = 0;

    const daysData = chronologicalDays.map((day) => {
      const isToday = day.dateStr === todayStr;
      let amount = 0;
      let goal = appData.water.dailyGoalMl;

      if (isToday) {
        amount = appData.water.consumedMl;
        goal = appData.water.dailyGoalMl;
      } else {
        const entry = (appData.water.history || []).find((h) => h.date === day.dateStr);
        if (entry) {
          amount = entry.amountMl;
          goal = entry.goalMl || appData.water.dailyGoalMl;
        }
      }

      const p = Math.min(100, Math.round((amount / Math.max(1, goal)) * 100));
      const met = amount >= goal;
      if (met) daysMetGoal++;

      return { ...day, isToday, amount, goal, percent: p, isGoalMet: met };
    });

    return `
      <div class="space-y-6 pb-12 max-w-xl mx-auto">
        <!-- Animated Flask & Metric Hero -->
        <div class="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-900/90 p-6 rounded-3xl border-2 border-sky-100 dark:border-slate-800 shadow-sm text-center transition-colors">
          <div class="relative mx-auto w-36 h-52 bg-white/90 dark:bg-slate-800/90 rounded-3xl p-2.5 border-4 border-sky-300 dark:border-sky-600 shadow-md flex flex-col justify-end overflow-hidden mb-4">
            <div class="absolute top-4 right-3 text-[10px] font-bold text-sky-400 select-none">100%</div>
            <div class="absolute top-1/2 -translate-y-1/2 right-3 text-[10px] font-bold text-sky-400 select-none">50%</div>
            <div class="absolute bottom-4 right-3 text-[10px] font-bold text-sky-400 select-none">0%</div>
            <div class="absolute inset-y-0 right-7 w-px border-r border-dashed border-sky-200 dark:border-sky-700"></div>

            <div
              class="w-full bg-gradient-to-t from-sky-500 to-sky-400 rounded-2xl transition-all duration-700 relative flex items-center justify-center shadow-inner overflow-hidden"
              style="height: ${Math.max(12, percent)}%"
            >
              <div class="absolute inset-0 bg-white/15 animate-pulse"></div>
              <div class="absolute top-1 left-2 w-8 h-1 bg-white/40 rounded-full"></div>
              <span class="text-white font-black text-sm drop-shadow-xs relative z-10">${percent}%</span>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-center gap-2">
              <div class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
                <span class="text-sky-600 dark:text-sky-400">${appData.water.consumedMl.toLocaleString('pt-BR')}</span>
                <span class="text-slate-400 text-xl font-bold">/</span>
                <span class="text-slate-700 dark:text-slate-300 text-2xl font-bold">${appData.water.dailyGoalMl.toLocaleString('pt-BR')} ml</span>
              </div>
              <button
                type="button"
                data-action="toggle-recalculate-water"
                class="p-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition cursor-pointer shadow-2xs"
                title="Recalcular Meta de Água"
              >
                🧮
              </button>
            </div>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ${
                isGoalReached
                  ? '🎉 Parabéns! Meta de água alcançada com sucesso!'
                  : `Faltam ${Math.max(0, appData.water.dailyGoalMl - appData.water.consumedMl).toLocaleString('pt-BR')} ml para sua meta de hoje`
              }
            </p>

            <div class="pt-2 flex justify-center">
              <button
                type="button"
                data-action="toggle-recalculate-water"
                class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                  showWaterRecalculate
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                }"
              >
                <span>🧮</span>
                <span>${showWaterRecalculate ? 'Fechar Calculadora' : 'Recalcular Meta de Água'}</span>
                <span>${showWaterRecalculate ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>

          <!-- Calculadora Recalcular Meta -->
          ${
            showWaterRecalculate
              ? `
            <div class="mt-4 pt-4 border-t border-sky-100 dark:border-slate-800 text-left space-y-3 animate-fade-in bg-white/90 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-sky-200 dark:border-slate-700 shadow-sm">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  🧮 Recalcular Meta por Peso Corporal
                </span>
                <span class="text-[10px] font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  Padrão: 35 ml / kg
                </span>
              </div>

              <form data-form="recalculate-water" class="space-y-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Seu peso corporal (kg):
                  </label>
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <input
                        type="number"
                        min="20"
                        max="250"
                        step="0.5"
                        id="input-weight-field"
                        value="${customWeightInput}"
                        class="w-full px-3.5 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-none focus:border-sky-500"
                        placeholder="Ex: 70"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                    <button
                      type="submit"
                      class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                    >
                      Recalcular
                    </button>
                  </div>
                </div>
              </form>

              ${
                calcSuccessMsg
                  ? `
                <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-2xs">
                  <span>✓</span>
                  <span>${calcSuccessMsg}</span>
                </div>
              `
                  : ''
              }
            </div>
          `
              : ''
          }
        </div>

        <!-- Portion Selector & Já Bebi Action -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>💧</span> Escolha o tamanho do copo:
          </h3>

          <div class="grid grid-cols-3 gap-2.5">
            ${[
              { ml: 200, label: 'Copo pequeno', icon: '🥛' },
              { ml: 300, label: 'Copo grande', icon: '🥤' },
              { ml: 500, label: 'Garrafinha', icon: '🍶' },
            ]
              .map(
                (item) => `
              <button
                type="button"
                data-action="select-glass"
                data-ml="${item.ml}"
                class="p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                  selectedGlassMl === item.ml
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                }"
              >
                <div class="text-2xl mb-1">${item.icon}</div>
                <div class="text-sm font-black">${item.ml} ml</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">${item.label}</div>
              </button>
            `
              )
              .join('')}
          </div>

          <button
            type="button"
            data-action="drink-water"
            class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-lg shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>💧</span> Já bebi! (+${selectedGlassMl} ml)
          </button>

          ${
            appData.water.consumedMl > 0
              ? `
            <div class="flex justify-center pt-1">
              <button
                type="button"
                data-action="undo-water"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <span>↺</span> Desfazer último copo (-${selectedGlassMl} ml)
              </button>
            </div>
          `
              : ''
          }
        </div>

        <!-- Histórico dos Últimos 7 Dias -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 text-base">
                📅
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-800 dark:text-white">Evolução dos Últimos 7 Dias</h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Sua constância de hidratação dia a dia</p>
              </div>
            </div>
            <span class="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              ${daysMetGoal} de 7 metas batidas ✨
            </span>
          </div>

          <div class="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
            ${daysData
              .map(
                (d) => `
              <div
                class="p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition ${
                  d.isToday
                    ? 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/50 shadow-xs ring-1 ring-sky-300'
                    : d.isGoalMet
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }"
              >
                <span class="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  ${d.dayShort}
                </span>

                <div class="w-full h-16 bg-white dark:bg-slate-800 rounded-xl overflow-hidden p-0.5 flex flex-col justify-end border border-slate-200 dark:border-slate-700 mb-1">
                  <div
                    class="w-full rounded-lg transition-all duration-500 ${
                      d.isGoalMet
                        ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-t from-sky-500 to-sky-400'
                    }"
                    style="height: ${Math.max(6, d.percent)}%"
                  ></div>
                </div>

                <div class="text-[10px] font-black leading-tight">
                  ${
                    d.isGoalMet
                      ? '<span class="text-emerald-600 dark:text-emerald-400">✓ Meta</span>'
                      : `<span class="text-slate-600 dark:text-slate-400">${d.percent}%</span>`
                  }
                </div>
                <span class="text-[10px] font-bold mt-0.5 ${
                  d.isToday ? 'text-sky-700 dark:text-sky-400 font-black underline' : 'text-slate-500 dark:text-slate-400'
                }">
                  ${d.label}
                </span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Reminders & Audio Settings Accordion -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <button
            type="button"
            data-action="toggle-water-reminders"
            class="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-700 text-lg">
                ⏰
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Horários de lembretes e avisos sonoros
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  ${appData.water.reminderTimes.length} horários programados • Som e vibração
                </p>
              </div>
            </div>
            <span class="text-slate-400">${showWaterReminders ? '▲' : '▼'}</span>
          </button>

          ${
            showWaterReminders
              ? `
            <div class="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-fade-in">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    ⏰ Horários dos lembretes (${appData.water.reminderTimes.length}):
                  </label>
                  <button
                    type="button"
                    data-action="water-default-times"
                    class="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Usar sugestão padrão
                  </button>
                </div>

                <div class="flex flex-wrap gap-2">
                  ${appData.water.reminderTimes
                    .map(
                      (t) => `
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 rounded-xl text-xs font-bold">
                      ${t}
                      <button
                        type="button"
                        data-action="remove-water-time"
                        data-time="${t}"
                        class="text-sky-400 hover:text-red-500 transition cursor-pointer font-black"
                      >
                        ×
                      </button>
                    </span>
                  `
                    )
                    .join('')}
                </div>

                <div class="flex flex-col gap-1.5 pt-1">
                  <div class="flex items-center gap-2">
                    <input
                      type="time"
                      id="new-water-time-input"
                      value="${newWaterReminderTime}"
                      class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs"
                    />
                    <button
                      type="button"
                      data-action="add-water-time"
                      class="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      + Adicionar horário
                    </button>
                  </div>
                  <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>👆</span> Click no relógio
                  </span>
                </div>
              </div>

              <!-- Sound toggles -->
              <div class="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Avisos sonoros e vibração
                </div>
                <div class="flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-action="toggle-water-sound"
                    class="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      appData.water.soundEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }"
                  >
                    Som: ${appData.water.soundEnabled ? 'Ligado 🔊' : 'Desligado 🔇'}
                  </button>
                  <button
                    type="button"
                    data-action="test-water-sound"
                    class="px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition cursor-pointer"
                  >
                    Testar som 🔊
                  </button>
                </div>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderMedicineScreen() {
    const todayStr = getTodayString();
    const currentDayOfWeek = new Date().getDay();

    return `
      <div class="space-y-6 pb-12 max-w-xl mx-auto">
        <!-- Header Info Banner -->
        <div class="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs flex items-center justify-between gap-3 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-2xl">
              💊
            </div>
            <div>
              <h2 class="text-sm font-black text-slate-900 dark:text-white">Controle Pontual de Medicamentos</h2>
              <p class="text-xs text-slate-600 dark:text-slate-300">O aviso toca no horário até você apertar &quot;Tomei!&quot;.</p>
            </div>
          </div>

          <button
            type="button"
            data-action="open-add-med-modal"
            class="shrink-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
          >
            + Adicionar
          </button>
        </div>

        <!-- Medicines List -->
        <div class="space-y-4">
          ${
            appData.medicine.medicines.length === 0
              ? `
            <div class="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div class="text-3xl">💊</div>
              <h4 class="text-base font-bold text-slate-700 dark:text-slate-200">Nenhum remédio cadastrado ainda</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Adicione seus medicamentos para receber alertas no horário correto e nunca esquecer uma dose.
              </p>
              <button
                type="button"
                data-action="open-add-med-modal"
                class="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Adicionar Primeiro Remédio
              </button>
            </div>
          `
              : appData.medicine.medicines
                  .map((med) => {
                    const isScheduledForToday =
                      med.frequency !== 'specific_days' ||
                      !med.specificDays ||
                      med.specificDays.includes(currentDayOfWeek);

                    const isConfirmingDelete = confirmingDeleteMedId === med.id;

                    const last7Days = getLast7Days();
                    const chronological7Days = [...last7Days].reverse();
                    let scheduledDaysCount = 0;
                    let fullyTakenDaysCount = 0;

                    chronological7Days.forEach((day) => {
                      const isSched =
                        med.frequency !== 'specific_days' ||
                        !med.specificDays ||
                        med.specificDays.includes(day.dayNumber);

                      if (isSched) {
                        scheduledDaysCount++;
                        const takenCount = (med.times || []).filter((t) =>
                          (med.history || []).some((h) => h.date === day.dateStr && h.time === t)
                        ).length;
                        if (med.times && med.times.length > 0 && takenCount >= med.times.length) {
                          fullyTakenDaysCount++;
                        }
                      }
                    });

                    const adherencePercent =
                      scheduledDaysCount > 0 && med.times && med.times.length > 0
                        ? Math.round((fullyTakenDaysCount / scheduledDaysCount) * 100)
                        : med.times && med.times.length === 0
                        ? 0
                        : 100;

                    return `
                <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs space-y-4 transition-colors">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs text-xl"
                        style="background-color: ${med.color || '#0284c7'}"
                      >
                        💊
                      </div>
                      <div>
                        <h3 class="text-base font-black text-slate-900 dark:text-white leading-tight">
                          ${med.name}
                        </h3>
                        <div class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                          Dosagem: <span class="text-slate-800 dark:text-slate-200">${med.dosage}</span>
                          ${
                            med.frequency === 'specific_days'
                              ? '<span class="ml-2 text-amber-600 dark:text-amber-400 font-semibold">(Dias específicos)</span>'
                              : ''
                          }
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        data-action="edit-med"
                        data-id="${med.id}"
                        class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Editar remédio"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        data-action="confirm-delete-med"
                        data-id="${med.id}"
                        class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Excluir remédio"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  ${
                    isConfirmingDelete
                      ? `
                    <div class="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2">
                      <span class="text-xs font-bold text-rose-800 dark:text-rose-200">Excluir este lembrete de remédio?</span>
                      <div class="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-action="delete-med-confirmed"
                          data-id="${med.id}"
                          class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition cursor-pointer"
                        >
                          Sim, excluir
                        </button>
                        <button
                          type="button"
                          data-action="cancel-delete-med"
                          class="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  `
                      : ''
                  }

                  ${
                    med.notes
                      ? `
                    <div class="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 flex items-start gap-1.5">
                      <span class="text-sky-600">ℹ️</span>
                      <span><strong>Observação:</strong> ${med.notes}</span>
                    </div>
                  `
                      : ''
                  }

                  <!-- Doses for today -->
                  <div class="space-y-2">
                    <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span class="flex items-center gap-1.5">
                        ⏰ Doses programadas hoje:
                      </span>
                      ${
                        !isScheduledForToday
                          ? '<span class="text-[11px] text-slate-400 font-normal italic">Não programado para hoje</span>'
                          : ''
                      }
                    </div>

                    ${
                      !med.times || med.times.length === 0
                        ? `
                      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic">
                        Nenhum horário cadastrado para este remédio. Toque no ícone de editar acima para adicionar horários.
                      </div>
                    `
                        : `
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${med.times
                          .map((scheduledTime) => {
                            const log = (med.history || []).find(
                              (h) => h.date === todayStr && h.time === scheduledTime
                            );
                            const isTaken = !!log;

                            return `
                            <div class="p-3 rounded-2xl border flex items-center justify-between gap-2 transition ${
                              isTaken
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                                : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                            }">
                              <div>
                                <div class="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                                  <span>⏰</span> ${scheduledTime}
                                </div>
                                <div class="text-[11px] font-bold mt-0.5">
                                  ${
                                    isTaken
                                      ? `<span class="text-emerald-700 dark:text-emerald-400">✓ Tomado às ${
                                          log.takenAt || scheduledTime
                                        }</span>`
                                      : '<span class="text-amber-700 dark:text-amber-400">Pendente hoje</span>'
                                  }
                                </div>
                              </div>

                              ${
                                isTaken
                                  ? `
                                <button
                                  type="button"
                                  data-action="unmark-med-dose"
                                  data-id="${med.id}"
                                  data-time="${scheduledTime}"
                                  class="px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  Desfazer
                                </button>
                              `
                                  : `
                                <button
                                  type="button"
                                  data-action="mark-med-dose"
                                  data-id="${med.id}"
                                  data-time="${scheduledTime}"
                                  class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  ✓ Tomei!
                                </button>
                              `
                              }
                            </div>
                          `;
                          })
                          .join('')}
                      </div>
                    `
                    }
                  </div>

                  <!-- 7 Days adherence -->
                  <div class="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>📅</span>
                        <span>Histórico dos últimos 7 dias:</span>
                      </div>
                      <span class="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        ${fullyTakenDaysCount}/${scheduledDaysCount} dias tomados (${adherencePercent}%)
                      </span>
                    </div>

                    <div class="grid grid-cols-7 gap-1 sm:gap-2">
                      ${chronological7Days
                        .map((day) => {
                          const isToday = day.dateStr === todayStr;
                          const isSched =
                            med.frequency !== 'specific_days' ||
                            !med.specificDays ||
                            med.specificDays.includes(day.dayNumber);
                          const takenCount = (med.times || []).filter((t) =>
                            (med.history || []).some((h) => h.date === day.dateStr && h.time === t)
                          ).length;
                          const hasTimes = med.times && med.times.length > 0;
                          const isComplete = isSched && hasTimes && takenCount >= med.times.length;
                          const isPartial = isSched && hasTimes && takenCount > 0 && takenCount < med.times.length;
                          const isPendingToday = isSched && isToday && takenCount === 0;
                          const dayKey = `${med.id}-${day.dateStr}`;
                          const isExpanded = selectedMedHistoryDayKey === dayKey;

                          return `
                          <button
                            type="button"
                            data-action="toggle-med-history-day"
                            data-key="${dayKey}"
                            class="p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-between text-center transition cursor-pointer ${
                              isExpanded
                                ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/80 dark:bg-amber-950/70 shadow-xs'
                                : isComplete
                                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                                : isPartial
                                ? 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                                : !isSched
                                ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 opacity-60'
                                : isPendingToday
                                ? 'border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500'
                            }"
                          >
                            <span class="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 leading-none mb-1">
                              ${day.dayShort}
                            </span>
                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1 ${
                              isComplete
                                ? 'bg-emerald-500 text-white'
                                : isPartial
                                ? 'bg-amber-500 text-white'
                                : !isSched
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 text-[10px]'
                                : isPendingToday
                                ? 'border-2 border-dashed border-sky-500 text-sky-600 dark:text-sky-400'
                                : 'bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600'
                            }">
                              ${isComplete ? '✓' : isPartial ? '½' : !isSched ? '—' : isPendingToday ? '⏰' : '×'}
                            </div>
                            <span class="text-[10px] font-bold ${isToday ? 'text-amber-700 dark:text-amber-400 underline font-black' : ''}">
                              ${day.label}
                            </span>
                          </button>
                        `;
                        })
                        .join('')}
                    </div>

                    <!-- Retroactive detail -->
                    ${
                      selectedMedHistoryDayKey && selectedMedHistoryDayKey.startsWith(`${med.id}-`)
                        ? (() => {
                            const dateStr = selectedMedHistoryDayKey.replace(`${med.id}-`, '');
                            const targetDay = chronological7Days.find((d) => d.dateStr === dateStr);
                            if (!targetDay) return '';

                            return `
                        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5 animate-fade-in">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                              <span>📅</span> ${targetDay.label} — ${targetDay.weekdayName} (${targetDay.dateStr})
                            </span>
                            <button
                              type="button"
                              data-action="close-med-history-day"
                              class="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              Fechar ✕
                            </button>
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            ${(med.times || [])
                              .map((scheduledTime) => {
                                const log = (med.history || []).find(
                                  (h) => h.date === targetDay.dateStr && h.time === scheduledTime
                                );
                                const isTaken = !!log;

                                return `
                              <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                isTaken
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }">
                                <div>
                                  <div class="font-bold text-slate-800 dark:text-white">⏰ ${scheduledTime}</div>
                                  <div class="text-[10px] font-semibold text-slate-500">
                                    ${isTaken ? '✓ Tomado' : 'Não tomado'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  data-action="retro-toggle-med-dose"
                                  data-id="${med.id}"
                                  data-date="${targetDay.dateStr}"
                                  data-time="${scheduledTime}"
                                  class="px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    isTaken
                                      ? 'border border-slate-300 dark:border-slate-600 text-slate-600'
                                      : 'bg-amber-500 text-white'
                                  }"
                                >
                                  ${isTaken ? 'Desfazer' : 'Marcar Tomado'}
                                </button>
                              </div>
                            `;
                              })
                              .join('')}
                          </div>
                        </div>
                      `;
                          })()
                        : ''
                    }
                  </div>
                </div>
              `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;
  }

  function renderEvolutionScreen() {
    const todayStr = getTodayString();
    const last7Days = getLast7Days();
    const chronological7Days = [...last7Days].reverse();

    const waterHistoryMap = new Map();
    (appData.water.history || []).forEach((h) => {
      waterHistoryMap.set(h.date, h.amountMl);
    });

    const water7DaysStats = chronological7Days.map((d) => {
      const isToday = d.dateStr === todayStr;
      const amount = isToday ? appData.water.consumedMl : waterHistoryMap.get(d.dateStr) || 0;
      const goal = appData.water.dailyGoalMl;
      const percent = Math.min(100, Math.round((amount / Math.max(1, goal)) * 100));
      const metGoal = amount >= goal;
      return { ...d, amount, goal, percent, metGoal, isToday };
    });

    const totalConsumed7Days = water7DaysStats.reduce((sum, item) => sum + item.amount, 0);
    const daysMetGoal = water7DaysStats.filter((item) => item.metGoal).length;
    const dailyAverageMl = Math.round(totalConsumed7Days / 7);

    return `
      <div class="space-y-6 pb-12 max-w-xl mx-auto">
        <!-- Top Banner da Tela da Evolução -->
        <div class="bg-gradient-to-br from-sky-500 via-teal-600 to-emerald-600 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
              📈
            </div>
            <div>
              <span class="text-xs font-black tracking-wider uppercase text-sky-200">
                Desempenho & Hábitos
              </span>
              <h2 class="text-2xl font-black tracking-tight leading-tight">
                Tela da Evolução
              </h2>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-sky-50 font-medium leading-relaxed mt-1">
            Acompanhe seu histórico dos últimos 7 dias, confira seus resultados e constância diária.
          </p>

          <div class="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/20 text-center">
            <div class="bg-white/10 rounded-2xl p-2.5">
              <div class="text-[10px] font-bold text-sky-100 uppercase">Metas Batidas</div>
              <div class="text-lg font-black">${daysMetGoal} / 7 dias</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-2.5">
              <div class="text-[10px] font-bold text-sky-100 uppercase">Média Água</div>
              <div class="text-lg font-black">${dailyAverageMl} ml</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-2.5">
              <div class="text-[10px] font-bold text-sky-100 uppercase">Remédios</div>
              <div class="text-lg font-black">${appData.medicine.medicines.length} ativos</div>
            </div>
          </div>

          <!-- Ações para Inicializar e Zerar Evoluções -->
          <div class="mt-4 pt-3.5 border-t border-white/20 space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-xs text-sky-100 font-bold flex items-center gap-1">
                <span>✨</span> Inicializar ou zerar dados:
              </span>
              <button
                type="button"
                data-action="init-sample-data"
                class="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-900 rounded-xl text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Preencher histórico com semana de exemplo"
              >
                <span>✨ Preencher Exemplo</span>
              </button>
            </div>

            <!-- Zerar por Função -->
            <div class="flex items-center justify-end flex-wrap gap-1.5 pt-0.5">
              <span class="text-[11px] text-sky-200 mr-auto font-medium">Zerar por função:</span>
              <button
                type="button"
                data-action="reset-water-history"
                class="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Zerar apenas o histórico de água"
              >
                <span>💧 Zerar Água</span>
              </button>
              <button
                type="button"
                data-action="reset-medicine-history"
                class="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Zerar apenas o histórico de remédios"
              >
                <span>💊 Zerar Remédios</span>
              </button>
              <button
                type="button"
                data-action="reset-all-history"
                class="px-2.5 py-1 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Zerar água e remédios dos 7 dias para reiniciar tudo"
              >
                <span>↺ Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 💧 Evolução da Água (Últimos 7 Dias) -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-100 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors space-y-4">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 text-xl font-bold">
                💧
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white">
                  Evolução da Água (Últimos 7 Dias)
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Meta diária: ${appData.water.dailyGoalMl.toLocaleString('pt-BR')} ml • Toque em um dia para ajustar
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                ${daysMetGoal} de 7 metas batidas ✨
              </span>
              <button
                type="button"
                data-action="reset-water-history"
                class="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ↺ Zerar Água
              </button>
            </div>
          </div>

          <!-- Interactive Bar Chart -->
          <div class="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-3">
            ${water7DaysStats
              .map((item) => {
                const isSelected = selectedWaterEvolutionDay === item.dateStr;
                return `
                <button
                  type="button"
                  data-action="select-water-evolution-day"
                  data-date="${item.dateStr}"
                  class="flex flex-col items-center justify-end p-1.5 sm:p-2 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-100/70 dark:bg-sky-950/80 shadow-xs'
                      : item.isToday
                      ? 'border-sky-400 bg-sky-50/60 dark:bg-sky-950/40'
                      : item.metGoal
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                  }"
                  title="${item.label}: ${item.amount} ml de ${item.goal} ml"
                >
                  <span class="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    ${item.amount > 0 ? item.amount : '0'}
                  </span>

                  <div class="w-5 sm:w-7 h-28 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
                    <div
                      class="w-full rounded-lg transition-all duration-700 ${
                        item.metGoal
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : item.amount > 0
                          ? 'bg-gradient-to-t from-sky-500 to-sky-400'
                          : 'bg-transparent'
                      }"
                      style="height: ${Math.max(item.amount > 0 ? 8 : 0, item.percent)}%"
                    ></div>
                  </div>

                  <div class="mt-2 text-center">
                    <div class="text-[11px] font-black text-slate-800 dark:text-white">${item.dayShort}</div>
                    <div class="text-[9px] font-bold text-slate-400">${item.label}</div>
                    ${
                      item.metGoal
                        ? '<span class="inline-block mt-0.5 text-[10px]">✨</span>'
                        : `<span class="inline-block mt-0.5 text-[10px] text-slate-400">${item.percent}%</span>`
                    }
                  </div>
                </button>
              `;
              })
              .join('')}
          </div>

          <!-- Selected Day Water Intake Modifier Panel -->
          ${
            selectedWaterEvolutionDay
              ? (() => {
                  const targetDay = water7DaysStats.find((d) => d.dateStr === selectedWaterEvolutionDay);
                  if (!targetDay) return '';
                  return `
              <div class="p-4 rounded-2xl bg-sky-50/90 dark:bg-slate-800/90 border border-sky-200 dark:border-sky-800 space-y-3 animate-fade-in text-xs shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="font-black text-slate-800 dark:text-white flex items-center gap-1.5 text-sm">
                    <span>💧</span> Inicializar / Ajustar Água de ${targetDay.label} (${targetDay.weekdayName})
                  </span>
                  <button
                    type="button"
                    data-action="close-water-evolution-day"
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                  >
                    Fechar ✕
                  </button>
                </div>

                <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Registrado neste dia: <strong class="text-sky-700 dark:text-sky-300">${targetDay.amount.toLocaleString(
                    'pt-BR'
                  )} ml</strong> de ${targetDay.goal.toLocaleString('pt-BR')} ml</span>
                  <span class="font-bold text-slate-500">(${targetDay.percent}%)</span>
                </div>

                <div class="space-y-1.5">
                  <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400">Ajuste rápido de consumo:</div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-action="set-evolution-water"
                      data-date="${targetDay.dateStr}"
                      data-amount="${targetDay.amount + 250}"
                      class="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-sky-100 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 rounded-xl font-bold cursor-pointer transition shadow-2xs"
                    >
                      + 250 ml (Copo)
                    </button>
                    <button
                      type="button"
                      data-action="set-evolution-water"
                      data-date="${targetDay.dateStr}"
                      data-amount="${targetDay.amount + 500}"
                      class="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-sky-100 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 rounded-xl font-bold cursor-pointer transition shadow-2xs"
                    >
                      + 500 ml (Garrafa)
                    </button>
                    <button
                      type="button"
                      data-action="set-evolution-water"
                      data-date="${targetDay.dateStr}"
                      data-amount="${targetDay.goal}"
                      class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black cursor-pointer transition shadow-2xs"
                    >
                      ✓ Bater Meta (${targetDay.goal.toLocaleString('pt-BR')} ml)
                    </button>
                    <button
                      type="button"
                      data-action="set-evolution-water"
                      data-date="${targetDay.dateStr}"
                      data-amount="0"
                      class="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl font-bold cursor-pointer transition"
                    >
                      Zerar (0 ml)
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-1 border-t border-sky-200/60 dark:border-slate-700">
                  <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300">Definir valor exato:</span>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="50"
                    id="custom-water-evolution-input"
                    value="${customWaterEvolutionInput}"
                    placeholder="Ex: 2000"
                    class="w-28 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    data-action="save-custom-evolution-water"
                    data-date="${targetDay.dateStr}"
                    class="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition cursor-pointer shadow-2xs"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            `;
                })()
              : ''
          }

          <div class="p-3 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-100 dark:border-sky-800/60 flex items-center justify-between text-xs">
            <span class="text-slate-600 dark:text-slate-300 font-medium">Total consumido nos últimos 7 dias:</span>
            <span class="font-black text-sky-800 dark:text-sky-300">
              ${(totalConsumed7Days / 1000).toFixed(2)} Litros (média ${dailyAverageMl} ml/dia)
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderAboutScreen() {
    return `
      <div class="space-y-6 pb-12 max-w-xl mx-auto">
        <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-3xl font-black text-sky-600">
              💧
            </div>
            <div>
              <h2 class="text-xl font-black text-slate-900 dark:text-white">Lembragua.online</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Versão 1.0.0 • 100% Offline</p>
            </div>
          </div>

          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            O <strong>Lembragua.online</strong> foi desenvolvido para facilitar a manutenção de hábitos essenciais: manter-se hidratado e tomar seus remédios no horário correto.
          </p>

          <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <h4 class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>🛡️</span> Privacidade e Segurança
            </h4>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
              Todos os seus dados (água consumida, remédios e histórico) são gravados <strong>exclusivamente no seu próprio navegador</strong>. Não é necessário cadastro e nenhum dado pessoal sai do seu aparelho.
            </p>
          </div>

          <!-- Backup e Restauração -->
          <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-bold text-slate-800 dark:text-white">Backup e Restauração de Dados:</h4>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                data-action="export-backup"
                class="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>💾</span> Exportar Backup (JSON)
              </button>
              <label class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <span>📂</span> Importar Backup
                <input type="file" id="import-backup-input" accept=".json" class="hidden" />
              </label>
            </div>
          </div>

          <!-- Resetar Tudo -->
          <div class="pt-4 border-t border-rose-100 dark:border-rose-950/60">
            <button
              type="button"
              data-action="reset-all-app-data"
              class="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ⚠️ Redefinir todos os dados de fábrica
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBottomNav() {
    return `
      <nav class="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-md transition-colors">
        <div class="max-w-md mx-auto px-3 py-2 flex items-center justify-around gap-1">
          <button
            type="button"
            data-action="nav-home"
            class="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'home'
                ? 'text-sky-600 dark:text-sky-400 font-black bg-sky-50 dark:bg-sky-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }"
          >
            <span class="text-xl">🏠</span>
            <span class="text-xs font-bold">Início</span>
          </button>

          <button
            type="button"
            data-action="nav-water"
            class="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'water'
                ? 'text-sky-600 dark:text-sky-400 font-black bg-sky-50 dark:bg-sky-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }"
          >
            <span class="text-xl">💧</span>
            <span class="text-xs font-bold">Água</span>
          </button>

          <button
            type="button"
            data-action="nav-medicine"
            class="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'medicine'
                ? 'text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }"
          >
            <span class="text-xl">💊</span>
            <span class="text-xs font-bold">Remédios</span>
          </button>

          <button
            type="button"
            data-action="nav-evolution"
            class="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'evolution'
                ? 'text-teal-600 dark:text-teal-400 font-black bg-teal-50 dark:bg-teal-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }"
          >
            <span class="text-xl">📈</span>
            <span class="text-xs font-bold">Evolução</span>
          </button>
        </div>
      </nav>
    `;
  }

  function renderMedicineModal() {
    const daysOfWeek = [
      { id: 1, label: 'Seg' },
      { id: 2, label: 'Ter' },
      { id: 3, label: 'Qua' },
      { id: 4, label: 'Qui' },
      { id: 5, label: 'Sex' },
      { id: 6, label: 'Sáb' },
      { id: 0, label: 'Dom' },
    ];

    const colors = ['#0284c7', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
        <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>💊</span>
              ${editingMedId ? 'Editar Remédio' : 'Novo Lembrete de Remédio'}
            </h3>
            <button
              type="button"
              data-action="close-med-modal"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold text-lg"
            >
              ✕
            </button>
          </div>

          <form data-form="save-medicine" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Remédio: *
              </label>
              <input
                type="text"
                required
                id="med-name-input"
                placeholder="Ex: Losartana, Dipirona, Vitamina C"
                value="${medFormName}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-amber-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dosagem:
              </label>
              <input
                type="text"
                id="med-dosage-input"
                placeholder="Ex: 50mg, 1 comprimido, 10 gotas"
                value="${medFormDosage}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-amber-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frequência / Repetição:
              </label>
              <select
                id="med-frequency-select"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800"
              >
                <option value="daily" ${medFormFrequency === 'daily' ? 'selected' : ''}>Diário (todos os dias)</option>
                <option value="specific_days" ${
                  medFormFrequency === 'specific_days' ? 'selected' : ''
                }>Dias específicos da semana</option>
                <option value="interval" ${medFormFrequency === 'interval' ? 'selected' : ''}>A cada X horas</option>
              </select>
            </div>

            ${
              medFormFrequency === 'specific_days'
                ? `
              <div class="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div class="text-xs font-bold text-slate-700 dark:text-slate-300">Dias específicos:</div>
                <div class="grid grid-cols-7 gap-1">
                  ${daysOfWeek
                    .map((d) => {
                      const sel = medFormSpecificDays.includes(d.id);
                      return `
                      <button
                        type="button"
                        data-action="toggle-med-specific-day"
                        data-day="${d.id}"
                        class="py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                          sel
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700'
                        }"
                      >
                        ${d.label}
                      </button>
                    `;
                    })
                    .join('')}
                </div>
              </div>
            `
                : ''
            }

            ${
              medFormFrequency === 'interval'
                ? `
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intervalo em horas:
                </label>
                <select
                  id="med-interval-hours-select"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800"
                >
                  <option value="4" ${medFormIntervalHours === 4 ? 'selected' : ''}>A cada 4 horas (6 doses/dia)</option>
                  <option value="6" ${medFormIntervalHours === 6 ? 'selected' : ''}>A cada 6 horas (4 doses/dia)</option>
                  <option value="8" ${medFormIntervalHours === 8 ? 'selected' : ''}>A cada 8 horas (3 doses/dia)</option>
                  <option value="12" ${medFormIntervalHours === 12 ? 'selected' : ''}>A cada 12 horas (2 doses/dia)</option>
                </select>
              </div>
            `
                : ''
            }

            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Horário(s) das doses:
              </label>

              <div class="flex flex-wrap gap-1.5">
                ${medFormTimes
                  .map(
                    (t) => `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold">
                    ${t}
                    <button
                      type="button"
                      data-action="remove-med-form-time"
                      data-time="${t}"
                      class="text-amber-500 hover:text-red-500 font-black cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                `
                  )
                  .join('')}
              </div>

              <div class="flex flex-col gap-1.5 pt-1">
                <div class="flex items-center gap-2">
                  <input
                    type="time"
                    id="med-time-input-field"
                    value="${medFormTimeInput}"
                    class="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 cursor-pointer shadow-2xs"
                  />
                  <button
                    type="button"
                    data-action="add-med-form-time"
                    class="px-3.5 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    + Adicionar horário
                  </button>
                </div>
                <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>👆</span> Click no relógio
                </span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observações de uso:
              </label>
              <input
                type="text"
                id="med-notes-input"
                placeholder="Ex: Tomar com água após o almoço"
                value="${medFormNotes}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Cor de identificação:
              </label>
              <div class="flex items-center gap-2">
                ${colors
                  .map(
                    (c) => `
                  <button
                    type="button"
                    data-action="select-med-color"
                    data-color="${c}"
                    class="w-7 h-7 rounded-full cursor-pointer transition ${
                      medFormColor === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                    }"
                    style="background-color: ${c}"
                  ></button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                data-action="close-med-modal"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
              >
                Salvar Remédio
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // --- Global Event Delegation ---
  function attachEventListeners() {
    const root = document.getElementById('root');
    if (!root) return;

    // Navigation and tab buttons
    root.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.getAttribute('data-action');

      el.onclick = (e) => {
        if (action === 'nav-home') {
          currentTab = 'home';
          renderApp();
        } else if (action === 'nav-water') {
          currentTab = 'water';
          renderApp();
        } else if (action === 'nav-medicine') {
          currentTab = 'medicine';
          renderApp();
        } else if (action === 'nav-evolution') {
          currentTab = 'evolution';
          renderApp();
        } else if (action === 'nav-about') {
          currentTab = 'about';
          renderApp();
        } else if (action === 'set-theme-light') {
          appData.settings.theme = 'light';
          saveData();
          renderApp();
        } else if (action === 'set-theme-dark') {
          appData.settings.theme = 'dark';
          saveData();
          renderApp();
        } else if (action === 'quick-drink-250') {
          e.stopPropagation();
          addWaterIntake(250);
        } else if (action === 'select-glass') {
          const ml = parseInt(el.getAttribute('data-ml'), 10);
          selectedGlassMl = ml;
          renderApp();
        } else if (action === 'drink-water') {
          addWaterIntake(selectedGlassMl);
        } else if (action === 'undo-water') {
          undoWaterIntake();
        } else if (action === 'toggle-recalculate-water') {
          showWaterRecalculate = !showWaterRecalculate;
          renderApp();
        } else if (action === 'toggle-water-reminders') {
          showWaterReminders = !showWaterReminders;
          renderApp();
        } else if (action === 'toggle-water-sound') {
          appData.water.soundEnabled = !appData.water.soundEnabled;
          saveData();
          renderApp();
        } else if (action === 'test-water-sound') {
          soundContext.playWaterDrop();
          triggerVibration([80, 50, 80]);
        } else if (action === 'water-default-times') {
          appData.water.reminderTimes = ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'];
          saveData();
          renderApp();
        } else if (action === 'add-water-time') {
          const input = document.getElementById('new-water-time-input');
          if (input && input.value) {
            if (!appData.water.reminderTimes.includes(input.value)) {
              appData.water.reminderTimes.push(input.value);
              appData.water.reminderTimes.sort();
              saveData();
              renderApp();
            }
          }
        } else if (action === 'remove-water-time') {
          const time = el.getAttribute('data-time');
          appData.water.reminderTimes = appData.water.reminderTimes.filter((t) => t !== time);
          saveData();
          renderApp();
        } else if (action === 'open-add-med-modal') {
          openMedicineModal();
        } else if (action === 'close-med-modal') {
          isMedModalOpen = false;
          renderApp();
        } else if (action === 'edit-med') {
          const medId = el.getAttribute('data-id');
          openMedicineModal(medId);
        } else if (action === 'confirm-delete-med') {
          const medId = el.getAttribute('data-id');
          confirmingDeleteMedId = confirmingDeleteMedId === medId ? null : medId;
          renderApp();
        } else if (action === 'cancel-delete-med') {
          confirmingDeleteMedId = null;
          renderApp();
        } else if (action === 'delete-med-confirmed') {
          const medId = el.getAttribute('data-id');
          appData.medicine.medicines = appData.medicine.medicines.filter((m) => m.id !== medId);
          confirmingDeleteMedId = null;
          saveData();
          renderApp();
          showToast('Medicamento removido com sucesso!');
        } else if (action === 'mark-med-dose') {
          const medId = el.getAttribute('data-id');
          const time = el.getAttribute('data-time');
          markMedicineDose(medId, time);
        } else if (action === 'unmark-med-dose') {
          const medId = el.getAttribute('data-id');
          const time = el.getAttribute('data-time');
          unmarkMedicineDose(medId, time);
        } else if (action === 'toggle-med-history-day') {
          const key = el.getAttribute('data-key');
          selectedMedHistoryDayKey = selectedMedHistoryDayKey === key ? null : key;
          renderApp();
        } else if (action === 'close-med-history-day') {
          selectedMedHistoryDayKey = null;
          renderApp();
        } else if (action === 'retro-toggle-med-dose') {
          const medId = el.getAttribute('data-id');
          const date = el.getAttribute('data-date');
          const time = el.getAttribute('data-time');
          toggleRetroMedicineDose(medId, date, time);
        } else if (action === 'toggle-med-specific-day') {
          const dayId = parseInt(el.getAttribute('data-day'), 10);
          if (medFormSpecificDays.includes(dayId)) {
            if (medFormSpecificDays.length > 1) {
              medFormSpecificDays = medFormSpecificDays.filter((d) => d !== dayId);
            }
          } else {
            medFormSpecificDays.push(dayId);
            medFormSpecificDays.sort();
          }
          renderApp();
        } else if (action === 'add-med-form-time') {
          const input = document.getElementById('med-time-input-field');
          if (input && input.value) {
            if (!medFormTimes.includes(input.value)) {
              medFormTimes.push(input.value);
              medFormTimes.sort();
              medFormTimeInput = '';
              renderApp();
            }
          }
        } else if (action === 'remove-med-form-time') {
          const time = el.getAttribute('data-time');
          medFormTimes = medFormTimes.filter((t) => t !== time);
          renderApp();
        } else if (action === 'select-med-color') {
          medFormColor = el.getAttribute('data-color');
          renderApp();
        } else if (action === 'init-sample-data') {
          initSampleData();
        } else if (action === 'reset-water-history') {
          resetWaterHistory();
        } else if (action === 'reset-medicine-history') {
          resetMedicineHistory();
        } else if (action === 'reset-all-history') {
          resetAllHistory();
        } else if (action === 'select-water-evolution-day') {
          const date = el.getAttribute('data-date');
          selectedWaterEvolutionDay = selectedWaterEvolutionDay === date ? null : date;
          renderApp();
        } else if (action === 'close-water-evolution-day') {
          selectedWaterEvolutionDay = null;
          renderApp();
        } else if (action === 'set-evolution-water') {
          const date = el.getAttribute('data-date');
          const amount = parseInt(el.getAttribute('data-amount'), 10);
          setEvolutionWaterIntake(date, amount);
        } else if (action === 'save-custom-evolution-water') {
          const date = el.getAttribute('data-date');
          const input = document.getElementById('custom-water-evolution-input');
          if (input) {
            const amount = parseInt(input.value, 10);
            if (!isNaN(amount)) {
              setEvolutionWaterIntake(date, amount);
            }
          }
        } else if (action === 'export-backup') {
          exportBackupJSON();
        } else if (action === 'reset-all-app-data') {
          if (window.confirm('Tem certeza que deseja redefinir todos os dados do Lembragua.online?')) {
            appData = defaultInitialData;
            saveData();
            renderApp();
            showToast('Dados de fábrica redefinidos com sucesso.');
          }
        }
      };
    });

    // Form handlers
    const recalcForm = root.querySelector('[data-form="recalculate-water"]');
    if (recalcForm) {
      recalcForm.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('input-weight-field');
        if (input) {
          const kg = parseFloat(input.value);
          if (!isNaN(kg) && kg >= 20 && kg <= 300) {
            const newGoal = Math.round(kg * 35);
            appData.water.weightKg = kg;
            appData.water.dailyGoalMl = newGoal;
            customWeightInput = String(kg);
            saveData();
            soundContext.playWaterDrop();
            calcSuccessMsg = `Meta recalculada: ${newGoal.toLocaleString('pt-BR')} ml/dia (${kg} kg) ✨`;
            renderApp();
            setTimeout(() => {
              calcSuccessMsg = null;
              renderApp();
            }, 4000);
          }
        }
      };
    }

    const medForm = root.querySelector('[data-form="save-medicine"]');
    if (medForm) {
      const nameInput = document.getElementById('med-name-input');
      const dosageInput = document.getElementById('med-dosage-input');
      const freqSelect = document.getElementById('med-frequency-select');
      const intervalSelect = document.getElementById('med-interval-hours-select');
      const notesInput = document.getElementById('med-notes-input');

      if (freqSelect) {
        freqSelect.onchange = (e) => {
          medFormFrequency = e.target.value;
          renderApp();
        };
      }

      medForm.onsubmit = (e) => {
        e.preventDefault();
        const nameVal = (nameInput?.value || '').trim();
        if (!nameVal) return;

        const dosageVal = (dosageInput?.value || '').trim() || '1 comprimido';
        const notesVal = (notesInput?.value || '').trim();
        const intervalHours = intervalSelect ? parseInt(intervalSelect.value, 10) : 8;

        if (editingMedId) {
          appData.medicine.medicines = appData.medicine.medicines.map((m) => {
            if (m.id !== editingMedId) return m;
            return {
              ...m,
              name: nameVal,
              dosage: dosageVal,
              times: medFormTimes,
              frequency: medFormFrequency,
              intervalHours: medFormFrequency === 'interval' ? intervalHours : undefined,
              specificDays: medFormFrequency === 'specific_days' ? medFormSpecificDays : undefined,
              notes: notesVal,
              color: medFormColor,
            };
          });
        } else {
          const newMed = {
            id: `med-${Date.now()}`,
            name: nameVal,
            dosage: dosageVal,
            times: medFormTimes,
            frequency: medFormFrequency,
            intervalHours: medFormFrequency === 'interval' ? intervalHours : undefined,
            specificDays: medFormFrequency === 'specific_days' ? medFormSpecificDays : undefined,
            notes: notesVal,
            color: medFormColor,
            history: [],
          };
          appData.medicine.medicines.push(newMed);
        }

        saveData();
        isMedModalOpen = false;
        renderApp();
        showToast(editingMedId ? 'Remédio atualizado com sucesso!' : 'Novo remédio cadastrado com sucesso!');
      };
    }

    const importInput = document.getElementById('import-backup-input');
    if (importInput) {
      importInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            if (parsed && parsed.water && parsed.medicine) {
              appData = parsed;
              saveData();
              renderApp();
              showToast('Backup restaurado com sucesso! ✨');
            } else {
              alert('Arquivo de backup inválido.');
            }
          } catch (err) {
            alert('Erro ao ler arquivo JSON de backup.');
          }
        };
        reader.readAsText(file);
      };
    }
  }

  // --- Actions Implementations ---
  function addWaterIntake(amount) {
    const wasGoalReached = appData.water.consumedMl >= appData.water.dailyGoalMl;
    appData.water.consumedMl += amount;
    saveData();

    if (appData.water.soundEnabled) {
      soundContext.playWaterDrop();
    }
    if (appData.water.vibrationEnabled) {
      triggerVibration([80, 50, 80]);
    }

    if (!wasGoalReached && appData.water.consumedMl >= appData.water.dailyGoalMl) {
      soundContext.playGoalCelebration();
      triggerConfetti();
      showToast('🎉 Parabéns! Você atingiu sua meta diária de hidratação!');
    } else {
      showToast(`+${amount} ml registrado! Hidrate-se sempre! 💧`);
    }

    renderApp();
  }

  function undoWaterIntake() {
    appData.water.consumedMl = Math.max(0, appData.water.consumedMl - selectedGlassMl);
    saveData();
    showToast(`Desfeito -${selectedGlassMl} ml.`);
    renderApp();
  }

  function markMedicineDose(medId, time) {
    const todayStr = getTodayString();
    const now = new Date();
    const currentClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    appData.medicine.medicines = appData.medicine.medicines.map((m) => {
      if (m.id !== medId) return m;
      const history = (m.history || []).filter((h) => !(h.date === todayStr && h.time === time));
      history.push({ date: todayStr, time, takenAt: currentClock });
      return { ...m, history };
    });

    saveData();
    soundContext.playGoalCelebration();
    triggerVibration([150, 60, 150]);
    triggerConfetti();
    showToast('Dose confirmada como tomada! Parabéns pelo cuidado! 💊');
    renderApp();
  }

  function unmarkMedicineDose(medId, time) {
    const todayStr = getTodayString();
    appData.medicine.medicines = appData.medicine.medicines.map((m) => {
      if (m.id !== medId) return m;
      const history = (m.history || []).filter((h) => !(h.date === todayStr && h.time === time));
      return { ...m, history };
    });
    saveData();
    showToast('Dose desmarcada.');
    renderApp();
  }

  function toggleRetroMedicineDose(medId, dateStr, time) {
    let willTake = false;
    appData.medicine.medicines = appData.medicine.medicines.map((m) => {
      if (m.id !== medId) return m;
      const alreadyTaken = (m.history || []).some((h) => h.date === dateStr && h.time === time);
      willTake = !alreadyTaken;
      let history = [...(m.history || [])];
      if (alreadyTaken) {
        history = history.filter((h) => !(h.date === dateStr && h.time === time));
      } else {
        history.push({ date: dateStr, time, takenAt: time });
      }
      return { ...m, history };
    });

    saveData();
    if (willTake) {
      soundContext.playGoalCelebration();
      triggerVibration([80, 50]);
    }
    renderApp();
  }

  function setEvolutionWaterIntake(dateStr, amount) {
    const todayStr = getTodayString();
    const clean = Math.max(0, Math.round(amount));

    if (dateStr === todayStr) {
      appData.water.consumedMl = clean;
    } else {
      const history = (appData.water.history || []).filter((h) => h.date !== dateStr);
      history.push({
        date: dateStr,
        amountMl: clean,
        goalMl: appData.water.dailyGoalMl,
      });
      appData.water.history = history;
    }

    saveData();
    soundContext.playWaterDrop();
    triggerVibration([60, 40]);
    showToast(`Água de ${dateStr === todayStr ? 'Hoje' : dateStr}: ${clean.toLocaleString('pt-BR')} ml atualizado! 💧`);
    renderApp();
  }

  function initSampleData() {
    const last7Days = getLast7Days();
    const chronological7Days = [...last7Days].reverse();
    const goal = appData.water.dailyGoalMl;
    const multipliers = [0.85, 1.0, 0.75, 1.0, 1.1, 0.95, 1.0];

    appData.water.history = chronological7Days.slice(0, 6).map((day, idx) => ({
      date: day.dateStr,
      amountMl: Math.round(goal * multipliers[idx]),
      goalMl: goal,
    }));
    appData.water.consumedMl = Math.round(goal * multipliers[6]);

    appData.medicine.medicines = appData.medicine.medicines.map((m) => {
      const sampleHistory = chronological7Days.flatMap((day, dayIdx) => {
        if (dayIdx === 2) return [];
        return (m.times || []).map((t) => ({
          date: day.dateStr,
          time: t,
          takenAt: t,
        }));
      });
      return { ...m, history: sampleHistory };
    });

    saveData();
    soundContext.playGoalCelebration();
    triggerVibration([100, 60, 100]);
    triggerConfetti();
    showToast('Evoluções inicializadas com histórico saudável de exemplo! ✨');
    renderApp();
  }

  function resetWaterHistory() {
    const last7Days = getLast7Days();
    const dayKeys = last7Days.map((d) => d.dateStr);

    appData.water.consumedMl = 0;
    appData.water.history = (appData.water.history || []).filter((h) => !dayKeys.includes(h.date));
    saveData();
    soundContext.playWaterDrop();
    triggerVibration([60, 40]);
    showToast('Evolução da Água dos 7 dias zerada com sucesso! 💧');
    renderApp();
  }

  function resetMedicineHistory() {
    const last7Days = getLast7Days();
    const dayKeys = last7Days.map((d) => d.dateStr);

    appData.medicine.medicines = appData.medicine.medicines.map((m) => ({
      ...m,
      history: (m.history || []).filter((h) => !dayKeys.includes(h.date)),
    }));
    saveData();
    soundContext.playWaterDrop();
    triggerVibration([60, 40]);
    showToast('Evolução dos Remédios dos 7 dias zerada com sucesso! 💊');
    renderApp();
  }

  function resetAllHistory() {
    resetWaterHistory();
    resetMedicineHistory();
    showToast('Evoluções zeradas com sucesso para reiniciar do zero! 🔄');
  }

  function openMedicineModal(medId) {
    if (medId) {
      const med = appData.medicine.medicines.find((m) => m.id === medId);
      if (med) {
        editingMedId = med.id;
        medFormName = med.name;
        medFormDosage = med.dosage;
        medFormTimes = [...(med.times || [])];
        medFormTimeInput = '';
        medFormFrequency = med.frequency;
        medFormIntervalHours = med.intervalHours || 8;
        medFormSpecificDays = med.specificDays || [1, 2, 3, 4, 5];
        medFormNotes = med.notes || '';
        medFormColor = med.color || '#0284c7';
      }
    } else {
      editingMedId = null;
      medFormName = '';
      medFormDosage = '';
      medFormTimes = ['08:00'];
      medFormTimeInput = '';
      medFormFrequency = 'daily';
      medFormIntervalHours = 8;
      medFormSpecificDays = [1, 2, 3, 4, 5];
      medFormNotes = '';
      medFormColor = '#0284c7';
    }
    isMedModalOpen = true;
    renderApp();
  }

  function exportBackupJSON() {
    const json = JSON.stringify(appData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lembragua-backup-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo de backup exportado com sucesso! 💾');
  }

  // --- Periodic background alarm check ---
  setInterval(() => {
    if (!appData) return;
    const now = new Date();
    const currentClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = getTodayString();

    // Check water reminders
    if (appData.water.reminderTimes && appData.water.reminderTimes.includes(currentClock)) {
      if (appData.water.consumedMl < appData.water.dailyGoalMl) {
        soundContext.playWaterDrop();
        triggerVibration([80, 50, 80]);
      }
    }

    // Check medicine reminders
    appData.medicine.medicines.forEach((med) => {
      if ((med.times || []).includes(currentClock)) {
        const taken = (med.history || []).some((h) => h.date === todayStr && h.time === currentClock);
        if (!taken) {
          soundContext.playGoalCelebration();
          triggerVibration([200, 100, 200]);
        }
      }
    });
  }, 30000);

  // --- Initialize App on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderApp();
  });
})();
