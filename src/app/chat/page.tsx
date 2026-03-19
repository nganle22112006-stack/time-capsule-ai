'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_AVATAR,
  LifeEvent,
  QuestionnaireData,
  buildMemoryNarrative,
  buildPersonaSummary,
  createDefaultQuestionnaireData,
  extractPersonaTags,
  normalizeAllData,
  normalizeLifeEvents,
  normalizeQuestionnaireData,
  prepareQuestionnaireForSave,
} from '@/lib/time-capsule';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  transient?: boolean;
}

const toSystemMessage = (content: string): ChatMessage => ({
  role: 'system',
  content,
});

const toAssistantMessage = (content: string): ChatMessage => ({
  role: 'assistant',
  content,
});

const hasQuestionnaireSignal = (questionnaire: QuestionnaireData) =>
  Boolean(
    questionnaire.nickname ||
      questionnaire.name ||
      questionnaire.selfIntro ||
      questionnaire.realPersonality ||
      questionnaire.currentGoals ||
      questionnaire.currentTroubles ||
      questionnaire.coreBeliefs ||
      questionnaire.speakingTone
  );

const buildWelcomeMessage = (questionnaire: QuestionnaireData) => {
  const version = questionnaire.versionName || '那个阶段的我';
  const name = questionnaire.nickname || questionnaire.name || '你';
  const mood = questionnaire.currentMood || '还在摸索答案';
  const trouble = questionnaire.currentTroubles || '不确定感';

  return `我是${version}。你现在来找我，像是把当时的自己从时间里轻轻叫醒。${name}，那时候的我处在“${mood}”，一直在和“${trouble}”较劲。你想从哪里聊起？`;
};

const parseStorageJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export default function ChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(createDefaultQuestionnaireData());
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // initialize only once on mount
    void initializeAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAgentCache = (prompt: string, nextLifeEvents: LifeEvent[], nextQuestionnaire: QuestionnaireData) => {
    localStorage.setItem(
      'timeCapsuleAgent',
      JSON.stringify({
        systemPrompt: prompt,
        lifeEvents: nextLifeEvents,
        questionnaireData: nextQuestionnaire,
        questionnaireSummary: {
          nickname: nextQuestionnaire.nickname || nextQuestionnaire.name,
          versionName: nextQuestionnaire.versionName,
          mbti: nextQuestionnaire.mbti,
          currentMood: nextQuestionnaire.currentMood,
        },
        createdAt: new Date().toISOString(),
      })
    );
  };

  const initializeAgent = async () => {
    try {
      setInitializing(true);

      let nextQuestionnaire = createDefaultQuestionnaireData();
      let nextLifeEvents: LifeEvent[] = [];
      let cachedPrompt = '';

      const questionnaireRaw = parseStorageJson<unknown>(localStorage.getItem('timeCapsuleData'));
      if (questionnaireRaw) {
        nextQuestionnaire = normalizeQuestionnaireData(questionnaireRaw);
      }

      const allDataRaw = parseStorageJson<unknown>(localStorage.getItem('timeCapsuleAllData'));
      if (allDataRaw) {
        const normalized = normalizeAllData(allDataRaw);
        if (normalized.questionnaire) {
          nextQuestionnaire = normalized.questionnaire;
        }
        nextLifeEvents = normalized.lifeEvents;
      }

      const cachedAgentRaw = parseStorageJson<{
        systemPrompt?: string;
        lifeEvents?: unknown;
        questionnaireData?: unknown;
        questionnaireSummary?: { nickname?: string; versionName?: string; mbti?: string; currentMood?: string };
      }>(localStorage.getItem('timeCapsuleAgent'));
      if (cachedAgentRaw) {
        const cachedAgent = cachedAgentRaw;
        cachedPrompt = cachedAgent.systemPrompt || '';
        if (cachedAgent.lifeEvents) {
          nextLifeEvents = normalizeLifeEvents(cachedAgent.lifeEvents);
        }
        if (cachedAgent.questionnaireData) {
          nextQuestionnaire = normalizeQuestionnaireData(cachedAgent.questionnaireData);
        } else if (cachedAgent.questionnaireSummary) {
          nextQuestionnaire = normalizeQuestionnaireData({
            ...nextQuestionnaire,
            nickname: cachedAgent.questionnaireSummary.nickname,
            versionName: cachedAgent.questionnaireSummary.versionName,
            mbti: cachedAgent.questionnaireSummary.mbti,
            currentMood: cachedAgent.questionnaireSummary.currentMood,
          });
        }
      }

      const normalizedQuestionnaire = prepareQuestionnaireForSave(nextQuestionnaire);
      setQuestionnaire(normalizedQuestionnaire);
      setLifeEvents(nextLifeEvents);
      localStorage.setItem('timeCapsuleData', JSON.stringify(normalizedQuestionnaire));
      localStorage.setItem(
        'timeCapsuleAllData',
        JSON.stringify({
          questionnaire: normalizedQuestionnaire,
          lifeEvents: nextLifeEvents,
        })
      );

      if (cachedPrompt) {
        setSystemPrompt(cachedPrompt);
        setMessages([toAssistantMessage(buildWelcomeMessage(normalizedQuestionnaire))]);
        setLoading(false);
        setInitializing(false);
        return;
      }

      if (!hasQuestionnaireSignal(normalizedQuestionnaire)) {
        setError('还没有找到可用的人格档案，请先完成问卷或导入文件。');
        setLoading(false);
        setInitializing(false);
        return;
      }

      const promptResponse = await fetch('/api/generate-system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaireData: normalizedQuestionnaire }),
      });
      const promptData = await promptResponse.json();

      if (!promptData.success || !promptData.systemPrompt) {
        throw new Error(promptData.error || '生成人格提示词失败');
      }

      setSystemPrompt(promptData.systemPrompt);

      saveAgentCache(promptData.systemPrompt, nextLifeEvents, normalizedQuestionnaire);
      setMessages([toAssistantMessage(buildWelcomeMessage(normalizedQuestionnaire))]);
      setLoading(false);
      setInitializing(false);
    } catch (err) {
      console.error('初始化失败:', err);
      setError('初始化失败，请稍后重试。');
      setLoading(false);
      setInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !systemPrompt) return;

    const userMessage = input.trim();
    setInput('');
    setExportMessage('');

    const historyForApi = [
      ...messagesRef.current
        .filter((item) => item.role !== 'system')
        .map((item) => ({ role: item.role as 'user' | 'assistant', content: item.content })),
      { role: 'user' as const, content: userMessage },
    ];

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '那个时候的你正在组织语言…',
          transient: true,
        },
      ]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          systemPrompt,
          lifeEvents,
          questionnaireData: questionnaire,
        }),
      });

      if (!response.ok) {
        let errorMessage = '网络请求失败';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const payload = (await response.json()) as { error?: string };
          errorMessage = payload.error || errorMessage;
        } else {
          errorMessage = (await response.text()) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('未获取到流式响应');
      }

      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as { content?: string; error?: string };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (!parsed.content) continue;
            assistantContent += parsed.content;
            setMessages((prev) => {
              const next = [...prev];
              const lastIndex = next.length - 1;
              if (lastIndex >= 0) {
                next[lastIndex] = {
                  role: 'assistant',
                  content: assistantContent,
                  transient: false,
                };
              }
              return next;
            });
          } catch {
            // Ignore partial chunks that are not complete JSON lines.
          }
        }
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && last.transient) {
          next[next.length - 1] = toAssistantMessage(
            '我有点卡住了，给我几秒，或者你换个问法再叫我一次。'
          );
          return next;
        }
        return [...next, toAssistantMessage('我有点卡住了，给我几秒，或者你换个问法再叫我一次。')];
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleMemoryMode = () => {
    const narrative = buildMemoryNarrative(questionnaire, lifeEvents);
    setMessages((prev) => [...prev, toSystemMessage(`回忆模式\n${narrative}`)]);
  };

  const downloadTextFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const handleExport = async (target: 'systemPrompt' | 'knowledge') => {
    setExportMessage('');
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          questionnaireData: questionnaire,
          lifeEvents,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '导出失败');
      }

      if (target === 'systemPrompt') {
        downloadTextFile(
          data.files.systemPrompt.filename,
          data.files.systemPrompt.content,
          data.files.systemPrompt.contentType
        );
      } else {
        downloadTextFile(
          data.files.knowledge.filename,
          data.files.knowledge.content,
          data.files.knowledge.contentType
        );
      }
      setExportMessage('你已经把这个阶段的自己保存下来了。');
    } catch (err) {
      console.error('导出失败:', err);
      setExportMessage('导出失败，请稍后重试。');
    }
  };

  const avatarUrl = questionnaire.avatarDataUrl || DEFAULT_AVATAR;
  const personaTags = useMemo(() => extractPersonaTags(questionnaire), [questionnaire]);
  const subtitle = useMemo(() => buildPersonaSummary(questionnaire), [questionnaire]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-400" />
          <p className="text-purple-200">正在把那个时间点的你唤醒...</p>
        </div>
      </div>
    );
  }

  if (error && !systemPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="max-w-md border-red-500/20 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-xl font-semibold text-white">暂时无法进入对话</h2>
            <p className="text-center text-purple-200">{error}</p>
            <Button onClick={() => router.push('/questionnaire')} className="bg-purple-600 text-white hover:bg-purple-700">
              去填写人格档案
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-6">
      <div className="flex h-[94vh] w-full max-w-5xl flex-col gap-4">
        <Card className="border-purple-500/25 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Image
                src={avatarUrl}
                alt="分身头像"
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-full border border-purple-300/60 object-cover"
              />
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-white">{questionnaire.versionName || '那个时间点的我'}</h1>
                <p className="text-sm text-purple-100/90">{subtitle}</p>
                <p className="text-xs text-purple-200/70">
                  昵称：{questionnaire.nickname || questionnaire.name || '未填写'} · MBTI：{questionnaire.mbti || '未填写'} ·
                  星座：{questionnaire.zodiac || '未填写'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleMemoryMode}
              className="border-purple-400/40 text-purple-100 hover:bg-purple-500/15"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              回忆模式
            </Button>
          </div>
          {personaTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {personaTags.map((tag) => (
                <span key={tag} className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-100">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card className="border-purple-500/25 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-sm text-purple-100">文件还在，那个时候的你就还在。</p>
          <div className="mt-2 text-xs text-purple-200/75">
            <p>system prompt txt：那个阶段的你会怎么说话、怎么思考。</p>
            <p>knowledge base json：那个阶段的你经历过什么、记住了什么。</p>
            <p>为控制文件体积，记忆档案不会包含头像原图，导入后会自动使用默认头像。</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => handleExport('systemPrompt')}
              disabled={initializing || !systemPrompt}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Download className="mr-2 h-4 w-4" />
              导出人格提示词
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport('knowledge')}
              disabled={initializing || !systemPrompt}
              className="border-purple-400/40 text-purple-100 hover:bg-purple-500/10"
            >
              <Download className="mr-2 h-4 w-4" />
              导出记忆档案
            </Button>
            {exportMessage && <span className="self-center text-xs text-emerald-300">{exportMessage}</span>}
          </div>
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden border-purple-500/20 bg-white/5 backdrop-blur-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => {
              if (message.role === 'system') {
                return (
                  <div key={index} className="mx-auto max-w-[85%] rounded-xl border border-purple-400/25 bg-purple-500/10 p-3">
                    <p className="whitespace-pre-wrap text-sm text-purple-100/95">{message.content}</p>
                  </div>
                );
              }

              if (message.role === 'assistant') {
                return (
                  <div key={index} className="flex items-start gap-2">
                    <Avatar className="mt-1 h-8 w-8 border border-purple-300/50">
                      <AvatarImage src={avatarUrl} alt="分身头像" />
                      <AvatarFallback>我</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-white/12 p-4 text-purple-50">
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-purple-600/90 p-4 text-sm text-white">
                    <p className="whitespace-pre-wrap leading-6">{message.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-purple-500/20 p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="对那个时间点的自己说点什么..."
                className="min-h-[62px] flex-1 resize-none border-purple-400/30 bg-white/5 text-white placeholder:text-purple-200/45"
                disabled={isStreaming || initializing}
              />
              <Button
                onClick={() => void handleSend()}
                disabled={!input.trim() || isStreaming || initializing}
                className="bg-purple-600 px-6 text-white hover:bg-purple-700"
              >
                {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : '发送'}
              </Button>
            </div>
            {isStreaming && <p className="mt-2 text-xs text-purple-200/70">那个时候的你正在组织语言...</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
