'use client';

import { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  normalizeLifeEvents,
  normalizeQuestionnaireData,
  prepareQuestionnaireForSave,
} from '@/lib/time-capsule';

export default function ImportPage() {
  const router = useRouter();
  const [systemPromptFile, setSystemPromptFile] = useState<File | null>(null);
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (type: 'system' | 'knowledge', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (type === 'system') {
      setSystemPromptFile(file);
    } else {
      setKnowledgeFile(file);
    }
    setError('');
  };

  const handleImport = async () => {
    if (!systemPromptFile || !knowledgeFile) {
      setError('请上传两个文件');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const systemPromptContent = await systemPromptFile.text();
      const knowledgeContent = await knowledgeFile.text();

      let knowledgeData: unknown;
      try {
        knowledgeData = JSON.parse(knowledgeContent);
      } catch {
        throw new Error('记忆档案文件格式不正确，必须是有效的 JSON 文件');
      }

      const response = await fetch('/api/import-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPromptContent,
          knowledgeBase: knowledgeData,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '导入失败，请检查文件格式');
      }

      const questionnaireData = prepareQuestionnaireForSave(
        normalizeQuestionnaireData(result.data?.questionnaireData || result.data?.questionnaireSummary || {})
      );
      const lifeEvents = normalizeLifeEvents(result.data?.lifeEvents);

      localStorage.setItem('timeCapsuleData', JSON.stringify(questionnaireData));
      localStorage.setItem(
        'timeCapsuleAllData',
        JSON.stringify({
          questionnaire: questionnaireData,
          lifeEvents,
        })
      );
      localStorage.setItem(
        'timeCapsuleAgent',
        JSON.stringify({
          systemPrompt: result.data.systemPrompt,
          lifeEvents,
          questionnaireData,
          questionnaireSummary: result.data.questionnaireSummary,
          importedAt: result.data.importedAt,
        })
      );

      router.push('/chat');
    } catch (err) {
      console.error('导入失败:', err);
      setError(err instanceof Error ? err.message : '导入失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-purple-200 hover:text-white">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回
          </Button>
          <h1 className="text-3xl font-bold text-white">导入时间档案</h1>
        </div>

        <Card className="border-purple-500/20 bg-white/5 p-6">
          <p className="text-center text-purple-200">
            上传你保存过的人格提示词和记忆档案，把那个阶段的自己重新带回来。
          </p>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className={`border-2 p-6 transition-all ${
              systemPromptFile
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-purple-500/20 bg-white/5 hover:border-purple-500/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-purple-500/20 p-4">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">人格提示词</h3>
                <p className="text-sm text-purple-300/70">上传 `.txt` 文件</p>
              </div>
              {systemPromptFile ? (
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">{systemPromptFile.name}</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept=".txt" onChange={(event) => handleFileChange('system', event)} className="hidden" />
                  <Button variant="outline" className="border-purple-500/30 text-purple-200">
                    选择文件
                  </Button>
                </label>
              )}
            </div>
          </Card>

          <Card
            className={`border-2 p-6 transition-all ${
              knowledgeFile
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-purple-500/20 bg-white/5 hover:border-purple-500/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-purple-500/20 p-4">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">记忆档案</h3>
                <p className="text-sm text-purple-300/70">上传 `.json` 文件</p>
              </div>
              {knowledgeFile ? (
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">{knowledgeFile.name}</span>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(event) => handleFileChange('knowledge', event)}
                    className="hidden"
                  />
                  <Button variant="outline" className="border-purple-500/30 text-purple-200">
                    选择文件
                  </Button>
                </label>
              )}
            </div>
          </Card>
        </div>

        {error && (
          <Card className="border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          </Card>
        )}

        <Button
          onClick={handleImport}
          disabled={!systemPromptFile || !knowledgeFile || loading}
          className="w-full bg-purple-600 py-6 text-lg text-white hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              正在导入...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              导入这个阶段的自己
            </>
          )}
        </Button>

        <Card className="border-purple-500/20 bg-white/5 p-6">
          <h4 className="mb-3 text-lg font-semibold text-white">导入提示</h4>
          <ul className="space-y-2 text-sm text-purple-200/80">
            <li>• 支持旧版文件与新版文件，缺失字段会自动补默认值。</li>
            <li>• 导入后会恢复问卷、事件和聊天人格，不需要重新填写。</li>
            <li>• 建议配对使用：`*-system-prompt.txt` + `*-memory-archive.json`。</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
