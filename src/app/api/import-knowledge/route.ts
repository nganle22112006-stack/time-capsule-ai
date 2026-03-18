import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeClient, HeaderUtils, DataSourceType } from 'coze-coding-dev-sdk';
import { createCozeRuntimeConfig, formatMissingCozeEnvMessage } from '@/lib/coze-env';

interface LifeEvent {
  title: string;
  date: string;
  description: string;
  mood?: string;
}

interface ImportRequest {
  lifeEvents: LifeEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    const { lifeEvents } = body;

    if (!lifeEvents || lifeEvents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '没有人生大事数据',
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

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new KnowledgeClient(cozeConfig.config, customHeaders);

    // 将人生大事转换为知识库文档
    const documents = lifeEvents.map((event) => ({
      source: DataSourceType.TEXT,
      raw_data: `## ${event.title}\n\n日期：${event.date}\n\n情绪标签：${event.mood || '未标注'}\n\n详细描述：\n${event.description}`,
    }));

    // 导入到知识库
    const response = await client.addDocuments(
      documents,
      'time_capsule_knowledge',
      {
        separator: '\n\n',
        max_tokens: 1000,
        remove_extra_spaces: true,
      }
    );

    if (response.code === 0) {
      return NextResponse.json({
        success: true,
        message: `成功导入 ${response.doc_ids?.length} 个人生大事`,
        docIds: response.doc_ids,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.msg || '导入知识库失败',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('导入知识库失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '导入知识库时发生错误',
      },
      { status: 500 }
    );
  }
}
