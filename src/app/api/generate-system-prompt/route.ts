import { NextRequest, NextResponse } from 'next/server';
import { buildPersonaSystemPrompt } from '@/lib/persona-prompt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionnaireData } = body as { questionnaireData?: unknown };

    if (!questionnaireData) {
      return NextResponse.json({ success: false, error: '缺少问卷数据' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      systemPrompt: buildPersonaSystemPrompt(questionnaireData),
      mode: 'local',
    });
  } catch (error) {
    console.error('Generate system prompt failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成人格提示词失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
