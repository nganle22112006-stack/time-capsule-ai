'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LifeEvent,
  normalizeAllData,
  normalizeLifeEvents,
  normalizeQuestionnaireData,
  prepareQuestionnaireForSave,
} from '@/lib/time-capsule';

const EMPTY_EVENT: LifeEvent = {
  id: '',
  title: '',
  date: '',
  description: '',
  mood: '',
};

const moodPresets = ['开心', '迷茫', '遗憾', '成长', '平静', '转折'];

export default function LifeEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<LifeEvent[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const allData = localStorage.getItem('timeCapsuleAllData');
      if (!allData) return [];
      return normalizeAllData(JSON.parse(allData)).lifeEvents;
    } catch (error) {
      console.error('读取人生事件失败:', error);
      return [];
    }
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<LifeEvent>(EMPTY_EVENT);
  const [showForm, setShowForm] = useState(false);

  const startCreate = () => {
    setEditingEventId(null);
    setEventDraft(EMPTY_EVENT);
    setShowForm(true);
  };

  const startEdit = (event: LifeEvent) => {
    setEditingEventId(event.id);
    setEventDraft(event);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingEventId(null);
    setEventDraft(EMPTY_EVENT);
    setShowForm(false);
  };

  const handleSaveEvent = () => {
    if (!eventDraft.title.trim() || !eventDraft.date.trim() || !eventDraft.description.trim()) {
      alert('请至少填写标题、日期和事件描述');
      return;
    }

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === editingEventId ? { ...eventDraft, mood: eventDraft.mood.trim() || '未标注' } : item
        )
      );
      resetForm();
      return;
    }

    const newEvent: LifeEvent = {
      ...eventDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      mood: eventDraft.mood.trim() || '未标注',
    };

    setEvents((prev) => [newEvent, ...prev]);
    resetForm();
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
  };

  const persistAllData = () => {
    const questionnaireRaw = localStorage.getItem('timeCapsuleData');
    const questionnaire = questionnaireRaw
      ? prepareQuestionnaireForSave(normalizeQuestionnaireData(JSON.parse(questionnaireRaw)))
      : null;

    localStorage.setItem(
      'timeCapsuleAllData',
      JSON.stringify({
        questionnaire,
        lifeEvents: normalizeLifeEvents(events),
      })
    );
  };

  const handleContinue = () => {
    persistAllData();
    router.push('/chat');
  };

  const handleSkip = () => {
    persistAllData();
    router.push('/chat');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-8">
      <div className="w-full max-w-5xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">人生事件时间轴</h1>
          <p className="text-purple-200">这些经历会成为那个时候的你的一部分。</p>
        </div>

        {!showForm && (
          <Button onClick={startCreate} className="w-full bg-purple-600 text-white hover:bg-purple-700">
            <Plus className="mr-2 h-5 w-5" />
            新增人生事件
          </Button>
        )}

        {showForm && (
          <Card className="border-purple-500/20 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-xl font-semibold text-white">
              {editingEventId ? '编辑人生事件' : '新增人生事件'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventTitle">事件标题</Label>
                <Input
                  id="eventTitle"
                  value={eventDraft.title}
                  onChange={(event) => setEventDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="例如：第一次离开家独居"
                  className="mt-2 border-purple-400/30 bg-white/5 text-white placeholder:text-purple-200/40"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="eventDate">事件日期</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDraft.date}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, date: event.target.value }))}
                    className="mt-2 border-purple-400/30 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="eventMood">心情标签</Label>
                  <Input
                    id="eventMood"
                    value={eventDraft.mood}
                    onChange={(event) => setEventDraft((prev) => ({ ...prev, mood: event.target.value }))}
                    placeholder="例如：成长、迷茫、开心"
                    className="mt-2 border-purple-400/30 bg-white/5 text-white placeholder:text-purple-200/40"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {moodPresets.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    onClick={() => setEventDraft((prev) => ({ ...prev, mood: item }))}
                    className="h-8 border-purple-400/40 text-purple-100 hover:bg-purple-500/15"
                  >
                    {item}
                  </Button>
                ))}
              </div>
              <div>
                <Label htmlFor="eventDescription">事件描述</Label>
                <Textarea
                  id="eventDescription"
                  rows={4}
                  value={eventDraft.description}
                  onChange={(event) => setEventDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="写下当时发生了什么，以及它为什么重要"
                  className="mt-2 border-purple-400/30 bg-white/5 text-white placeholder:text-purple-200/40"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEvent} className="flex-1 bg-purple-600 text-white hover:bg-purple-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {editingEventId ? '保存修改' : '保存事件'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-purple-400/40 text-purple-100 hover:bg-purple-500/10"
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {events.length > 0 && (
          <Card className="border-purple-500/20 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-6 text-xl font-semibold text-white">已记录事件（{events.length}）</h3>
            <div className="relative space-y-5">
              <div className="absolute left-[22px] top-3 h-[calc(100%-24px)] w-px bg-purple-400/30" />
              {events
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((event) => (
                  <div key={event.id} className="relative pl-12">
                    <div className="absolute left-[14px] top-4 h-4 w-4 rounded-full border-2 border-purple-300 bg-purple-600" />
                    <div className="rounded-2xl border border-purple-400/25 bg-slate-900/40 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-white">{event.title}</h4>
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-100">
                          {event.date || '未填写日期'}
                        </span>
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-100">
                          {event.mood || '未标注'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-purple-100/85">{event.description}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(event)}
                          className="text-purple-200 hover:bg-purple-500/15 hover:text-white"
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-rose-300 hover:bg-rose-500/15 hover:text-rose-100"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {events.length === 0 && !showForm && (
          <Card className="border-purple-500/20 bg-white/5 p-10 text-center backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white">还没有记录事件</h3>
            <p className="mt-2 text-sm text-purple-200/70">从一个对你有情绪重量的时刻开始就可以。</p>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 border-purple-400/40 text-purple-100 hover:bg-purple-500/10"
          >
            先不写，去聊天
          </Button>
          <Button onClick={handleContinue} className="flex-1 bg-purple-600 text-white hover:bg-purple-700">
            完成记录，和那个时候的自己聊天
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
