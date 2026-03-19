import test from 'node:test';
import assert from 'node:assert/strict';

const { buildPersonaSystemPrompt } = await import('../src/lib/persona-prompt.ts');
const { createDefaultQuestionnaireData } = await import('../src/lib/time-capsule.ts');

test('buildPersonaSystemPrompt emphasizes language style and stage context', () => {
  const prompt = buildPersonaSystemPrompt({
    ...createDefaultQuestionnaireData(),
    versionName: '2026年春天的我',
    nickname: '阿宁',
    speakingTone: '温柔但直接',
    catchphrases: '欸，我想想',
    chatHabit: '哈哈、呜呜',
    comfortStyle: '先共情再分析',
    currentTroubles: '很怕未来不确定',
    currentGoals: '先把转行尝试一次',
    currentMood: '迷茫但还在坚持',
    misunderstoodPoint: '看起来很冷，其实只是慢热',
  });

  assert.match(prompt, /2026年春天的我/);
  assert.match(prompt, /温柔但直接/);
  assert.match(prompt, /欸，我想想/);
  assert.match(prompt, /先共情再分析/);
  assert.match(prompt, /很怕未来不确定/);
  assert.match(prompt, /不要编造/);
});
