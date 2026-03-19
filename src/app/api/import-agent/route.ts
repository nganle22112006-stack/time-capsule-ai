import { NextRequest, NextResponse } from 'next/server';
import { normalizeLifeEvents, normalizeQuestionnaireData } from '@/lib/time-capsule';

interface ImportRequest {
  systemPrompt?: string;
  knowledgeBase?: {
    datasetName?: string;
    documents?: unknown;
    metadata?: {
      createdAt?: string;
      questionnaireSummary?: {
        nickname?: string;
        name?: string;
        versionName?: string;
        mbti?: string;
        zodiac?: string;
        currentMood?: string;
      };
      questionnaireData?: unknown;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    const { systemPrompt, knowledgeBase } = body;

    if (!systemPrompt || !knowledgeBase) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要的数据，请确认上传了正确的文件',
        },
        { status: 400 }
      );
    }

    if (!systemPrompt.trim() || systemPrompt.trim().length < 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'System Prompt 内容不完整，请确认上传了正确的文件',
        },
        { status: 400 }
      );
    }

    const events = normalizeLifeEvents(knowledgeBase.documents);
    const fallbackQuestionnaire = knowledgeBase.metadata?.questionnaireSummary || {};
    const questionnaireData = normalizeQuestionnaireData(
      knowledgeBase.metadata?.questionnaireData || {
        nickname: fallbackQuestionnaire.nickname || fallbackQuestionnaire.name,
        name: fallbackQuestionnaire.name || fallbackQuestionnaire.nickname,
        versionName: fallbackQuestionnaire.versionName,
        mbti: fallbackQuestionnaire.mbti,
        zodiac: fallbackQuestionnaire.zodiac,
        currentMood: fallbackQuestionnaire.currentMood,
      }
    );

    return NextResponse.json({
      success: true,
      message: '阶段档案导入成功',
      data: {
        systemPrompt,
        lifeEvents: events,
        questionnaireData,
        questionnaireSummary: {
          nickname: questionnaireData.nickname || questionnaireData.name,
          versionName: questionnaireData.versionName,
          mbti: questionnaireData.mbti,
          zodiac: questionnaireData.zodiac,
          currentMood: questionnaireData.currentMood,
        },
        knowledgeImport: {
          success: true,
          count: events.length,
          mode: 'local-only',
        },
        importedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Import agent failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导入阶段档案时发生错误，请检查文件格式是否正确',
      },
      { status: 500 }
    );
  }
}
