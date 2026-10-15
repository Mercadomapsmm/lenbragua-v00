export interface MotivationalQuote {
  id: number;
  phrase: string;
  author: string;
  category: 'saúde' | 'constância' | 'hidratação' | 'autocuidado' | 'ânimo';
  icon: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 1,
    phrase: 'Cuidar de você não é gasto de tempo, é o investimento mais valioso da sua vida.',
    author: 'Cuidado & Saúde',
    category: 'autocuidado',
    icon: '✨',
  },
  {
    id: 2,
    phrase: 'Pequenos hábitos diários constroem grandes resultados para a sua saúde e disposição.',
    author: 'Constância Diária',
    category: 'constância',
    icon: '🌱',
  },
  {
    id: 3,
    phrase: 'A cada copo de água e a cada dose no horário, você diz "sim" para a sua longevidade.',
    author: 'Vida Saudável',
    category: 'saúde',
    icon: '💧',
  },
  {
    id: 4,
    phrase: 'Hoje é um novo dia cheio de possibilidades. Respire fundo, hidrate-se e viva com leveza!',
    author: 'Bom Dia com Saúde',
    category: 'ânimo',
    icon: '☀️',
  },
  {
    id: 5,
    phrase: 'O segredo da saúde do corpo e da mente não é lamentar o passado, mas viver o presente com sabedoria.',
    author: 'Sabedoria de Vida',
    category: 'saúde',
    icon: '🌿',
  },
  {
    id: 6,
    phrase: 'Você não precisa ser perfeito todos os dias, apenas persistente. O seu esforço vale a pena!',
    author: 'Inspiração Diária',
    category: 'constância',
    icon: '💪',
  },
  {
    id: 7,
    phrase: 'Tomar seus remédios com carinho e disciplina é um lindo ato de compromisso com quem você ama.',
    author: 'Autocuidado',
    category: 'autocuidado',
    icon: '❤️',
  },
  {
    id: 8,
    phrase: 'Beba água, movimente o corpo e alimente sua mente com pensamentos que te elevam.',
    author: 'Equilíbrio Total',
    category: 'hidratação',
    icon: '🌊',
  },
  {
    id: 9,
    phrase: 'A maior riqueza do ser humano é a sua saúde e a paz no coração.',
    author: 'Provérbio de Bem-Estar',
    category: 'saúde',
    icon: '🧘',
  },
  {
    id: 10,
    phrase: 'Celebre cada pequena vitória de hoje: um copo d’água a mais já faz diferença no seu corpo!',
    author: 'Pequenas Vitórias',
    category: 'hidratação',
    icon: '🎉',
  },
  {
    id: 11,
    phrase: 'Seja gentil com você mesmo. Cada dia que você cuida da sua rotina é um passo para uma vida melhor.',
    author: 'Paz Interior',
    category: 'autocuidado',
    icon: '🌸',
  },
  {
    id: 12,
    phrase: 'A disciplina é a ponte que liga seus desejos de saúde ao seu bem-estar de amanhã.',
    author: 'Foco no Bem',
    category: 'constância',
    icon: '🎯',
  },
  {
    id: 13,
    phrase: 'A água purifica, renova as energias e dá vida a todas as células do seu corpo.',
    author: 'Poder da Hidratação',
    category: 'hidratação',
    icon: '💧',
  },
  {
    id: 14,
    phrase: 'Não deixe para depois o cuidado que o seu corpo precisa agora. Priorize a sua saúde!',
    author: 'Atenção ao Presente',
    category: 'saúde',
    icon: '⏰',
  },
  {
    id: 15,
    phrase: 'A gratidão transforma o que temos em suficiente e traz serenidade para todo o dia.',
    author: 'Coração Leve',
    category: 'ânimo',
    icon: '🕊️',
  },
  {
    id: 16,
    phrase: 'Seguir seus horários com pontualidade traz tranquilidade para o seu corpo e paz para a sua mente.',
    author: 'Rotina Tranquila',
    category: 'autocuidado',
    icon: '🛡️',
  },
  {
    id: 17,
    phrase: 'A saúde não é apenas a ausência de dor, mas a presença diária de vitalidade e alegria de viver.',
    author: 'Vitalidade Plena',
    category: 'saúde',
    icon: '⚡',
  },
  {
    id: 18,
    phrase: 'Comece onde você está, use o que você tem e faça o que puder hoje pela sua saúde.',
    author: 'Arthur Ashe',
    category: 'constância',
    icon: '🚀',
  },
  {
    id: 19,
    phrase: 'Beba um gole de água agora e sinta a sensação de renovação que ela traz ao seu organismo.',
    author: 'Pausa para Hidratar',
    category: 'hidratação',
    icon: '🥤',
  },
  {
    id: 20,
    phrase: 'A constância supera a intensidade. É o carinho diário que mantém o seu corpo forte e saudável.',
    author: 'Lembragua.online',
    category: 'constância',
    icon: '🌟',
  },
  {
    id: 21,
    phrase: 'Sorria! O sorriso libera boas energias, relaxa as tensões e faz bem para todo o coração.',
    author: 'Alegria Diária',
    category: 'ânimo',
    icon: '😊',
  },
  {
    id: 22,
    phrase: 'Cada dose tomada no horário certo é um abraço de proteção que você se dá.',
    author: 'Cuidado Contínuo',
    category: 'autocuidado',
    icon: '💊',
  },
  {
    id: 23,
    phrase: 'Hidratar-se é o jeito mais simples e poderoso de dizer ao seu corpo que você se importa.',
    author: 'Dica do Dia',
    category: 'hidratação',
    icon: '💎',
  },
  {
    id: 24,
    phrase: 'Respeite os limites do seu corpo e comemore cada progresso, por mais sutil que pareça.',
    author: 'Equilíbrio & Respeito',
    category: 'saúde',
    icon: '🕊️',
  },
  {
    id: 25,
    phrase: 'Que o seu dia seja abençoado, sereno e cheio de bons momentos de autocuidado.',
    author: 'Votos de Luz',
    category: 'ânimo',
    icon: '🌻',
  },
  {
    id: 26,
    phrase: 'O hábito de se cuidar todos os dias é a chave mestra para colher disposição e saúde no futuro.',
    author: 'Saúde & Longevidade',
    category: 'constância',
    icon: '🗝️',
  },
  {
    id: 27,
    phrase: 'Um passo de cada vez, um gole de água por vez, e o seu dia se torna extraordinário!',
    author: 'Passo a Passo',
    category: 'constância',
    icon: '👣',
  },
  {
    id: 28,
    phrase: 'Nunca se esqueça: você é a pessoa mais importante da sua vida. Cuide-se com amor!',
    author: 'Amor-Próprio',
    category: 'autocuidado',
    icon: '💖',
  },
  {
    id: 29,
    phrase: 'A água é combustível para sua clareza mental e para o bom funcionamento de todos os seus órgãos.',
    author: 'Nutrição & Saúde',
    category: 'hidratação',
    icon: '🧠',
  },
  {
    id: 30,
    phrase: 'Termine o dia com a certeza de que você fez o seu melhor pela sua saúde hoje.',
    author: 'Conclusão Positiva',
    category: 'ânimo',
    icon: '🌙',
  },
];

/**
 * Returns deterministic motivational quote for a given date string (YYYY-MM-DD).
 * Changes automatically every single day ("todos os dias").
 */
export function getDailyMotivationalQuote(dateStr?: string): MotivationalQuote {
  let dateObj = new Date();
  if (dateStr) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  // Calculate day of the year
  const start = new Date(dateObj.getFullYear(), 0, 0);
  const diff = dateObj.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs((dayOfYear + dateObj.getFullYear()) % MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}

/**
 * Returns a random quote different from the current one.
 */
export function getRandomMotivationalQuote(excludeId?: number): MotivationalQuote {
  const filtered = MOTIVATIONAL_QUOTES.filter((q) => q.id !== excludeId);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || MOTIVATIONAL_QUOTES[0];
}
