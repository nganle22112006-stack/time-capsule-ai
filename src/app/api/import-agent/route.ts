import { NextRequest, NextResponse } from 'next/server';
import { DataSourceType, HeaderUtils, KnowledgeClient } from 'coze-coding-dev-sdk';
import { createCozeRuntimeConfig, formatMissingCozeEnvMessage } from '@/lib/coze-env';
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
          error: '缺少必要的数据，请确保上传了正确的文件',
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

    const cozeConfig = createCozeRuntimeConfig();
    if (!cozeConfig.ok) {
      return NextResponse.json(
        {
          success: false,
          error: formatMissingCozeEnvMessage(cozeConfig.missing),
          missingEnvVars: cozeConfig.missing,
        },
        { status: 503 }
      );
    }

    const events = normalizeLifeEvents(knowledgeBase.documents);
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = cozeConfig.config;

    let importResult: {
      success: boolean;
      count?: number;
      docIds?: string[];
      error?: string;
    } | null = null;

    if (events.length > 0) {
      try {
        const client = new KnowledgeClient(config, customHeaders);
        const documents = events.map((event) => ({
          source: DataSourceType.TEXT,
          raw_data: `## ${event.title}\n\n日期：${event.date}\n\n情绪标签：${event.mood || '未标注'}\n\n详细描述：\n${event.description}`,
        }));

        const response = await client.addDocuments(documents, 'time_capsule_knowledge', {
          separator: '\n\n',
          max_tokens: 1000,
          remove_extra_spaces: true,
        });

        importResult = {
          success: response.code === 0,
          count: response.doc_ids?.length || 0,
          docIds: response.doc_ids,
        };
      } catch (error) {
        console.error('知识库导入失败:', error);
        importResult = {
          success: false,
          error: '知识库导入失败',
        };
      }
    }

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
      message: '智能体导入成功',
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
        knowledgeImport: importResult,
        importedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('导入智能体失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导入智能体时发生错误，请检查文件格式是否正确',
      },
      { status: 500 }
    );
  }
}
