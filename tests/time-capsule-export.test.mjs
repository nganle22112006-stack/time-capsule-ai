import test from 'node:test';
import assert from 'node:assert/strict';

const {
  buildExportableQuestionnaireData,
  buildKnowledgeExportContent,
  createDefaultQuestionnaireData,
} = await import('../src/lib/time-capsule.ts');

test('buildExportableQuestionnaireData removes avatar payload but keeps persona text fields', () => {
  const questionnaire = {
    ...createDefaultQuestionnaireData(),
    versionName: '2026年春天的我',
    nickname: '阿宁',
    mbti: 'INFJ',
    currentMood: '迷茫但在坚持',
    avatarDataUrl: 'data:image/png;base64,' + 'A'.repeat(1024),
    avatarMimeType: 'image/png',
  };

  const exported = buildExportableQuestionnaireData(questionnaire);

  assert.equal(exported.versionName, '2026年春天的我');
  assert.equal(exported.nickname, '阿宁');
  assert.equal(exported.mbti, 'INFJ');
  assert.equal(exported.currentMood, '迷茫但在坚持');
  assert.ok(!('avatarDataUrl' in exported));
  assert.ok(!('avatarMimeType' in exported));
});

test('buildKnowledgeExportContent keeps events and writes slim questionnaire metadata', () => {
  const questionnaire = {
    ...createDefaultQuestionnaireData(),
    versionName: '2026年春天的我',
    nickname: '阿宁',
    avatarDataUrl: 'data:image/png;base64,' + 'B'.repeat(2048),
  };

  const archive = buildKnowledgeExportContent(questionnaire, [
    {
      id: '1',
      title: '离开学校',
      date: '2026-03-01',
      mood: '成长',
      description: '开始独立生活',
    },
  ]);

  assert.equal(archive.documents.length, 1);
  assert.equal(archive.documents[0].mood, '成长');
  assert.equal(archive.metadata.questionnaireData.nickname, '阿宁');
  assert.ok(!('avatarDataUrl' in archive.metadata.questionnaireData));
  assert.ok(!('avatarMimeType' in archive.metadata.questionnaireData));
});
