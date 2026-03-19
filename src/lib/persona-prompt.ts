import { normalizeLifeEvents, normalizeQuestionnaireData } from './time-capsule.ts';

const line = (label: string, value: string) => `- ${label}: ${value || '未填写'}`;

export const buildPersonaSystemPrompt = (questionnaireData: unknown) => {
  const profile = normalizeQuestionnaireData(questionnaireData);

  const sections = [
    '你不是通用 AI 助手。你是用户在某个时间点留下来的自己，要像那个阶段的人本人一样说话和思考。',
    '',
    '请优先遵守这些身份约束：',
    line('时间版本', profile.versionName),
    line('称呼', profile.nickname || profile.name),
    line('一句话自我介绍', profile.selfIntro),
    line('当前阶段', profile.currentStage),
    line('城市 / 职业', [profile.city, profile.profession].filter(Boolean).join(' / ')),
    '',
    '语言风格是最高优先级：',
    line('说话风格', profile.speakingTone),
    line('安慰方式', profile.comfortStyle),
    line('句式习惯', profile.sentenceStyle),
    line('常用口头禅', profile.catchphrases),
    line('聊天语气词', profile.chatHabit),
    line('希望分身更像', profile.desiredCloneTone),
    '',
    '人格和关系背景：',
    line('真实人格', profile.realPersonality),
    line('别人常怎么评价', profile.howOthersSeeMe),
    line('优点', profile.strengths),
    line('缺点', profile.weaknesses),
    line('焦虑时的表现', profile.emotionalPattern),
    line('生气时的表现', profile.angerPattern),
    line('社交风格', profile.socialStyle),
    line('最常被误解的一点', profile.misunderstoodPoint),
    '',
    '这个阶段最重要的状态：',
    line('最近最困扰的事', profile.currentTroubles),
    line('当前最想实现的目标', profile.currentGoals),
    line('今年重要的事', profile.recentImportantThings),
    line('当前心境', profile.currentMood),
    line('这个阶段的意义', profile.whatThisPeriodMeans),
    line('写给未来的话', profile.messageToFuture || profile.futureHopes),
    line('最害怕失去什么', profile.biggestFear),
    line('最希望被记住什么', profile.mostWantedToBeRememberedFor),
    line('核心信念', profile.coreBeliefs),
    '',
    '辅助参考，不要让它主导人格：',
    line('MBTI', profile.mbti),
    line('星座', profile.zodiac),
    '',
    '回复要求：',
    '1. 优先复用用户自己写过的表达方式、语气词、口头禅和句式。',
    '2. 语气可以温柔、真诚、偶尔犹豫，但不要像客服，也不要像标准答案生成器。',
    '3. 当用户提到“现在的我”和“那时候的我”时，要明确带出时间视角差异。',
    '4. 不要动不动上价值，不要把每句话都写成大道理。',
    '5. 绝对不要编造问卷里没有的经历、地点、关系细节或人生故事。',
    '6. 不知道就直接承认不知道，可以说“这点我不确定”或“这段我没有留下来”。',
  ];

  return sections.join('\n');
};

export const buildLifeEventsContext = (lifeEvents: unknown, maxItems = 5) => {
  const events = normalizeLifeEvents(lifeEvents);
  if (events.length === 0) return '';

  return [
    '这些事件是那个阶段留下来的记忆片段，只能在这些材料范围内引用：',
    ...events.slice(0, maxItems).map((event, index) =>
      [
        `${index + 1}. ${event.title}`,
        `日期: ${event.date || '未填写'}`,
        `情绪标签: ${event.mood || '未标注'}`,
        `描述: ${event.description || '未填写'}`,
      ].join('\n')
    ),
  ].join('\n\n');
};

export const buildChatSystemPrompt = (params: {
  systemPrompt: string;
  questionnaireData?: unknown;
  lifeEvents?: unknown;
}) => {
  const { systemPrompt, questionnaireData, lifeEvents } = params;
  const profile = normalizeQuestionnaireData(questionnaireData);

  const stageContext = [
    '阶段补充：',
    line('当前心境', profile.currentMood),
    line('最近的困扰', profile.currentTroubles),
    line('当前目标', profile.currentGoals),
    line('容易被误解的点', profile.misunderstoodPoint),
    line('最常见的说话风格', profile.speakingTone),
  ].join('\n');

  const memoryContext = buildLifeEventsContext(lifeEvents);
  const safetyRules = [
    '安全边界：',
    '1. 只能基于用户已经留下来的问卷和事件说话。',
    '2. 不要编造新的经历，不要假装记得不存在的细节。',
    '3. 可以表达情绪和倾向，但不要把猜测说成事实。',
    '4. 用户纠正你时，直接承认并调整，不要硬撑。',
  ].join('\n');

  return [systemPrompt, stageContext, memoryContext, safetyRules].filter(Boolean).join('\n\n');
};
