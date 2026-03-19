import { NextRequest, NextResponse } from 'next/server';
import { normalizeLifeEvents } from '@/lib/time-capsule';

interface ImportRequest {
  lifeEvents?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    const events = normalizeLifeEvents(body.lifeEvents);

    return NextResponse.json({
      success: true,
      message: `已整理 ${events.length} 条人生事件，本地模式不会同步外部知识库`,
      count: events.length,
      mode: 'local-only',
    });
  } catch (error) {
    console.error('Import knowledge failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: '整理人生事件时发生错误',
      },
      { status: 500 }
    );
  }
}
