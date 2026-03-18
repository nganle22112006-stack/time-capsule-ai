export interface QuestionnaireData {
  // Legacy fields (kept for compatibility)
  name: string;
  worldView: string;
  lifeView: string;
  valueView: string;
  hobbies: string;
  interests: string;
  futureHopes: string;
  futureGoals: string;
  relationshipGoals: string;
  lifePhilosophy: string;
  lifeMotto: string;

  // New profile fields
  nickname: string;
  age: string;
  currentStage: string;
  city: string;
  profession: string;
  mbti: string;
  zodiac: string;
  selfIntro: string;
  versionName: string;
  howOthersSeeMe: string;
  realPersonality: string;
  strengths: string;
  weaknesses: string;
  emotionalPattern: string;
  angerPattern: string;
  socialStyle: string;
  speakingTone: string;
  comfortStyle: string;
  sentenceStyle: string;
  catchphrases: string;
  chatHabit: string;
  desiredCloneTone: string;
  friendshipView: string;
  familyView: string;
  loveView: string;
  biggestFear: string;
  mostWantedToBeRememberedFor: string;
  misunderstoodPoint: string;
  coreBeliefs: string;
  currentTroubles: string;
  currentGoals: string;
  recentImportantThings: string;
  messageToFuture: string;
  currentMood: string;
  whatThisPeriodMeans: string;

  // Avatar profile
  avatarDataUrl: string;
  avatarMimeType: string;
}

export interface LifeEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  mood: string;
}

export interface TimeCapsuleAllData {
  questionnaire: QuestionnaireData | null;
  lifeEvents: LifeEvent[];
}

export type ExportableQuestionnaireData = Omit<
  QuestionnaireData,
  'avatarDataUrl' | 'avatarMimeType'
>;

export interface KnowledgeExportContent {
  datasetName: string;
  documents: Array<{
    title: string;
    date: string;
    mood: string;
    description: string;
  }>;
  metadata: {
    createdAt: string;
    questionnaireSummary: {
      versionName: string;
      nickname: string;
      mbti: string;
      zodiac: string;
      currentMood: string;
    };
    questionnaireData: ExportableQuestionnaireData;
  };
}

export const DEFAULT_AVATAR = '/default-avatar.svg';

const getCurrentSeason = (month: number) => {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const firstNonEmpty = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = toStringValue(value).trim();
    if (normalized) return normalized;
  }
  return '';
};

const parseSeasonFromText = (text: string) => {
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.includes('spring') || text.includes('春')) return 'spring';
  if (lower.includes('summer') || text.includes('夏')) return 'summer';
  if (lower.includes('autumn') || lower.includes('fall') || text.includes('秋')) return 'autumn';
  if (lower.includes('winter') || text.includes('冬')) return 'winter';
  return '';
};

export const createDefaultQuestionnaireData = (): QuestionnaireData => {
  const now = new Date();
  const season = getCurrentSeason(now.getMonth() + 1);
  return {
    // Legacy fields
    name: '',
    worldView: '',
    lifeView: '',
    valueView: '',
    hobbies: '',
    interests: '',
    futureHopes: '',
    futureGoals: '',
    relationshipGoals: '',
    lifePhilosophy: '',
    lifeMotto: '',

    // New fields
    nickname: '',
    age: '',
    currentStage: '',
    city: '',
    profession: '',
    mbti: '',
    zodiac: '',
    selfIntro: '',
    versionName: `${now.getFullYear()}年${season === 'spring' ? '春天' : season === 'summer' ? '夏天' : season === 'autumn' ? '秋天' : '冬天'}的我`,
    howOthersSeeMe: '',
    realPersonality: '',
    strengths: '',
    weaknesses: '',
    emotionalPattern: '',
    angerPattern: '',
    socialStyle: '',
    speakingTone: '',
    comfortStyle: '',
    sentenceStyle: '',
    catchphrases: '',
    chatHabit: '',
    desiredCloneTone: '',
    friendshipView: '',
    familyView: '',
    loveView: '',
    biggestFear: '',
    mostWantedToBeRememberedFor: '',
    misunderstoodPoint: '',
    coreBeliefs: '',
    currentTroubles: '',
    currentGoals: '',
    recentImportantThings: '',
    messageToFuture: '',
    currentMood: '',
    whatThisPeriodMeans: '',
    avatarDataUrl: '',
    avatarMimeType: '',
  };
};

export const normalizeQuestionnaireData = (raw: unknown): QuestionnaireData => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const defaults = createDefaultQuestionnaireData();

  const normalized: QuestionnaireData = {
    ...defaults,

    // Legacy fields
    name: firstNonEmpty(source.name, source.nickname),
    worldView: firstNonEmpty(source.worldView, source.coreBeliefs),
    lifeView: firstNonEmpty(source.lifeView, source.whatThisPeriodMeans),
    valueView: firstNonEmpty(source.valueView, source.coreBeliefs),
    hobbies: firstNonEmpty(source.hobbies, source.chatHabit),
    interests: firstNonEmpty(source.interests, source.profession),
    futureHopes: firstNonEmpty(source.futureHopes, source.messageToFuture),
    futureGoals: firstNonEmpty(source.futureGoals, source.currentGoals),
    relationshipGoals: firstNonEmpty(source.relationshipGoals, source.loveView),
    lifePhilosophy: firstNonEmpty(source.lifePhilosophy, source.coreBeliefs),
    lifeMotto: firstNonEmpty(source.lifeMotto, source.messageToFuture),

    // New fields
    nickname: firstNonEmpty(source.nickname, source.name),
    age: firstNonEmpty(source.age),
    currentStage: firstNonEmpty(source.currentStage),
    city: firstNonEmpty(source.city),
    profession: firstNonEmpty(source.profession),
    mbti: firstNonEmpty(source.mbti),
    zodiac: firstNonEmpty(source.zodiac),
    selfIntro: firstNonEmpty(source.selfIntro),
    versionName: firstNonEmpty(source.versionName, defaults.versionName),
    howOthersSeeMe: firstNonEmpty(source.howOthersSeeMe),
    realPersonality: firstNonEmpty(source.realPersonality),
    strengths: firstNonEmpty(source.strengths),
    weaknesses: firstNonEmpty(source.weaknesses),
    emotionalPattern: firstNonEmpty(source.emotionalPattern),
    angerPattern: firstNonEmpty(source.angerPattern),
    socialStyle: firstNonEmpty(source.socialStyle),
    speakingTone: firstNonEmpty(source.speakingTone),
    comfortStyle: firstNonEmpty(source.comfortStyle),
    sentenceStyle: firstNonEmpty(source.sentenceStyle),
    catchphrases: firstNonEmpty(source.catchphrases),
    chatHabit: firstNonEmpty(source.chatHabit),
    desiredCloneTone: firstNonEmpty(source.desiredCloneTone),
    friendshipView: firstNonEmpty(source.friendshipView),
    familyView: firstNonEmpty(source.familyView),
    loveView: firstNonEmpty(source.loveView),
    biggestFear: firstNonEmpty(source.biggestFear),
    mostWantedToBeRememberedFor: firstNonEmpty(source.mostWantedToBeRememberedFor),
    misunderstoodPoint: firstNonEmpty(source.misunderstoodPoint),
    coreBeliefs: firstNonEmpty(source.coreBeliefs, source.valueView),
    currentTroubles: firstNonEmpty(source.currentTroubles),
    currentGoals: firstNonEmpty(source.currentGoals, source.futureGoals),
    recentImportantThings: firstNonEmpty(source.recentImportantThings),
    messageToFuture: firstNonEmpty(source.messageToFuture, source.futureHopes),
    currentMood: firstNonEmpty(source.currentMood),
    whatThisPeriodMeans: firstNonEmpty(source.whatThisPeriodMeans, source.lifeView),
    avatarDataUrl: firstNonEmpty(source.avatarDataUrl, source.avatarUrl),
    avatarMimeType: firstNonEmpty(source.avatarMimeType),
  };

  if (!normalized.name) {
    normalized.name = normalized.nickname;
  }
  if (!normalized.nickname) {
    normalized.nickname = normalized.name;
  }

  return normalized;
};

export const prepareQuestionnaireForSave = (raw: QuestionnaireData): QuestionnaireData => {
  const normalized = normalizeQuestionnaireData(raw);

  return {
    ...normalized,
    name: firstNonEmpty(normalized.nickname, normalized.name),
    worldView: firstNonEmpty(normalized.worldView, normalized.coreBeliefs),
    lifeView: firstNonEmpty(normalized.whatThisPeriodMeans, normalized.lifeView),
    valueView: firstNonEmpty(normalized.coreBeliefs, normalized.valueView),
    hobbies: firstNonEmpty(normalized.chatHabit, normalized.hobbies),
    interests: firstNonEmpty(normalized.profession, normalized.interests),
    futureHopes: firstNonEmpty(normalized.messageToFuture, normalized.futureHopes),
    futureGoals: firstNonEmpty(normalized.currentGoals, normalized.futureGoals),
    relationshipGoals: firstNonEmpty(normalized.relationshipGoals, normalized.loveView),
    lifePhilosophy: firstNonEmpty(normalized.coreBeliefs, normalized.lifePhilosophy),
    lifeMotto: firstNonEmpty(normalized.messageToFuture, normalized.lifeMotto),
  };
};

export const normalizeLifeEvents = (raw: unknown): LifeEvent[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const event = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const title = firstNonEmpty(event.title, `事件 ${index + 1}`);
      const date = firstNonEmpty(event.date);
      const description = firstNonEmpty(event.description);
      const mood = firstNonEmpty(event.mood, event.tag, '未标注');
      const id = firstNonEmpty(event.id, `${Date.now()}-${index}-${title}`);

      if (!title && !description) return null;
      return {
        id,
        title,
        date,
        description,
        mood,
      };
    })
    .filter((item): item is LifeEvent => Boolean(item));
};

export const normalizeAllData = (raw: unknown): TimeCapsuleAllData => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    questionnaire: source.questionnaire ? normalizeQuestionnaireData(source.questionnaire) : null,
    lifeEvents: normalizeLifeEvents(source.lifeEvents),
  };
};

const splitToTags = (text: string) =>
  text
    .split(/[\s,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const extractPersonaTags = (questionnaire: QuestionnaireData, max = 6) => {
  const tags = [
    ...splitToTags(questionnaire.speakingTone),
    ...splitToTags(questionnaire.realPersonality),
    ...splitToTags(questionnaire.currentMood),
  ];
  return Array.from(new Set(tags)).slice(0, max);
};

const shortText = (text: string, maxLength = 24) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const buildPersonaSummary = (questionnaire: QuestionnaireData) => {
  const trouble = shortText(questionnaire.currentTroubles);
  const goal = shortText(questionnaire.currentGoals);
  const tone = shortText(questionnaire.speakingTone || questionnaire.realPersonality);

  const troubleText = trouble ? `很怕“${trouble}”` : '还在和不确定感拉扯';
  const goalText = goal ? `但还是想把“${goal}”再试一次` : '但还是想努力试一次';
  const toneText = tone ? `说话会偏${tone}` : '说话会偏克制和真诚';
  return `那时候的我，${troubleText}，${goalText}。${toneText}。`;
};

export const buildMemoryNarrative = (questionnaire: QuestionnaireData, lifeEvents: LifeEvent[]) => {
  const version = questionnaire.versionName || '那个阶段的我';
  const mood = questionnaire.currentMood || '有点复杂但还在前进';
  const troubles = questionnaire.currentTroubles || '还在摸索怎么和焦虑和平相处';
  const goals = questionnaire.currentGoals || '把想做的事一点点做出来';
  const beliefs = questionnaire.coreBeliefs || questionnaire.mostWantedToBeRememberedFor || '真诚地活过';
  const voice = questionnaire.speakingTone || questionnaire.chatHabit || '不太会把话说满';
  const topEvents = lifeEvents
    .slice(0, 3)
    .map((event) => `${event.date || '某天'}的「${event.title}」`)
    .join('、');

  const eventSentence = topEvents
    ? `我记得${topEvents}，这些都在悄悄改写我。`
    : '那段时间没有写下太多事件，但情绪和念头都还在。';

  return `我是${version}。那时我的状态是${mood}，最困扰我的是${troubles}，但我也一直想实现${goals}。${eventSentence}我说话通常${voice}。如果你愿意，我会把当时坚持的事慢慢讲给你听：${beliefs}。`;
};

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildExportBaseName = (questionnaire: QuestionnaireData) => {
  const now = new Date();
  const yearFromVersion = questionnaire.versionName.match(/(19|20)\d{2}/)?.[0];
  const year = yearFromVersion || String(now.getFullYear());
  const seasonFromVersion = parseSeasonFromText(questionnaire.versionName);
  const season = seasonFromVersion || getCurrentSeason(now.getMonth() + 1);
  const nickPart = sanitizeSegment(firstNonEmpty(questionnaire.nickname, questionnaire.name));

  if (nickPart) {
    return `${year}-${season}-${nickPart}-me`;
  }
  return `${year}-${season}-me`;
};

export const buildExportFileNames = (questionnaire: QuestionnaireData) => {
  const baseName = buildExportBaseName(questionnaire);
  return {
    systemPrompt: `${baseName}-system-prompt.txt`,
    knowledge: `${baseName}-memory-archive.json`,
  };
};

export const buildExportableQuestionnaireData = (
  questionnaire: QuestionnaireData
): ExportableQuestionnaireData => {
  const { avatarDataUrl, avatarMimeType, ...exportable } = questionnaire;
  void avatarDataUrl;
  void avatarMimeType;
  return exportable;
};

export const buildKnowledgeExportContent = (
  questionnaire: QuestionnaireData,
  lifeEvents: LifeEvent[]
): KnowledgeExportContent => {
  const exportableQuestionnaire = buildExportableQuestionnaireData(questionnaire);

  return {
    datasetName: 'time_capsule_knowledge',
    documents: lifeEvents.map((event) => ({
      title: event.title,
      date: event.date,
      mood: event.mood,
      description: event.description,
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      questionnaireSummary: {
        versionName: questionnaire.versionName,
        nickname: questionnaire.nickname || questionnaire.name,
        mbti: questionnaire.mbti,
        zodiac: questionnaire.zodiac,
        currentMood: questionnaire.currentMood,
      },
      questionnaireData: exportableQuestionnaire,
    },
  };
};
