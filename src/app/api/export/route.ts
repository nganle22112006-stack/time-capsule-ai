import { NextRequest, NextResponse } from 'next/server';
import {
  buildKnowledgeExportContent,
  buildExportFileNames,
  normalizeLifeEvents,
  normalizeQuestionnaireData,
} from '@/lib/time-capsule';

interface ExportRequest {
  systemPrompt: string;
  questionnaireData?: unknown;
  lifeEvents?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { systemPrompt, questionnaireData, lifeEvents } = body;

    if (!systemPrompt || !systemPrompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少 system prompt 内容',
        },
        { status: 400 }
      );
    }

    const profile = normalizeQuestionnaireData(questionnaireData);
    const events = normalizeLifeEvents(lifeEvents);
    const fileNames = buildExportFileNames(profile);
    const knowledgeContent = buildKnowledgeExportContent(profile, events);

    return NextResponse.json({
      success: true,
      message: '你已经把这个阶段的自己保存下来了。',
      files: {
        systemPrompt: {
          filename: fileNames.systemPrompt,
          content: systemPrompt,
          contentType: 'text/plain',
        },
        knowledge: {
          filename: fileNames.knowledge,
          content: JSON.stringify(knowledgeContent),
          contentType: 'application/json',
        },
      },
    });
  } catch (error) {
    console.error('导出文件失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导出文件时发生错误',
      },
      { status: 500 }
    );
  }
}
