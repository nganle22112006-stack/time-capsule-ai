'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_AVATAR,
  QuestionnaireData,
  createDefaultQuestionnaireData,
  normalizeQuestionnaireData,
  prepareQuestionnaireForSave,
} from '@/lib/time-capsule';

const DRAFT_KEY = 'timeCapsuleDataDraft';
const DATA_KEY = 'timeCapsuleData';

const steps = [
  {
    id: 'identity',
    icon: '🪪',
    title: '基础身份',
    description: '先记录这个阶段的你是谁，给这个版本起一个名字。',
  },
  {
    id: 'personality',
    icon: '🫧',
    title: '性格与内在',
    description: '描述你的真实状态，而不是理想状态。',
  },
  {
    id: 'language',
    icon: '🗣️',
    title: '语言风格',
    description: '这一步最关键，会决定分身说话像不像你。',
  },
  {
    id: 'values',
    icon: '🫶',
    title: '关系与价值观',
    description: '写下你在关系里的位置、害怕和坚持。',
  },
  {
    id: 'stage',
    icon: '🧭',
    title: '阶段状态',
    description: '记录当下最困扰、最想实现和最想留给未来的话。',
  },
  {
    id: 'avatar',
    icon: '📷',
    title: '形象档案',
    description: '上传一张头像，给这个时间版本留下可见的样子。',
  },
];

const sectionInputClass = 'mt-2 bg-white/5 border-purple-400/30 text-white placeholder:text-purple-200/40';

export default function QuestionnairePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>(createDefaultQuestionnaireData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      const saved = localStorage.getItem(DATA_KEY);
      const source = draft || saved;
      if (source) {
        setFormData(normalizeQuestionnaireData(JSON.parse(source)));
      }
    } catch (error) {
      console.error('读取问卷草稿失败:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const prepared = prepareQuestionnaireForSave(formData);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(prepared));
    localStorage.setItem(DATA_KEY, JSON.stringify(prepared));
  }, [formData, hydrated]);

  const updateFormData = (field: keyof QuestionnaireData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      updateFormData('avatarDataUrl', dataUrl);
      updateFormData('avatarMimeType', file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    const prepared = prepareQuestionnaireForSave(formData);
    localStorage.setItem(DATA_KEY, JSON.stringify(prepared));
    localStorage.removeItem(DRAFT_KEY);
    router.push('/life-events');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const avatarPreview = useMemo(
    () => formData.avatarDataUrl || DEFAULT_AVATAR,
    [formData.avatarDataUrl]
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="versionName">这个时间版本的名字</Label>
              <Input
                id="versionName"
                value={formData.versionName}
                onChange={(event) => updateFormData('versionName', event.target.value)}
                placeholder="例如：2026年春天的我"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(event) => updateFormData('nickname', event.target.value)}
                placeholder="你希望那个阶段的自己怎么称呼你"
                className={sectionInputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="age">年龄或出生年份</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(event) => updateFormData('age', event.target.value)}
                  placeholder="例如：24 或 2002"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="currentStage">当前阶段</Label>
                <Input
                  id="currentStage"
                  value={formData.currentStage}
                  onChange={(event) => updateFormData('currentStage', event.target.value)}
                  placeholder="例如：刚工作/转行中"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="city">所在城市</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(event) => updateFormData('city', event.target.value)}
                  placeholder="例如：上海"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="profession">专业/职业</Label>
                <Input
                  id="profession"
                  value={formData.profession}
                  onChange={(event) => updateFormData('profession', event.target.value)}
                  placeholder="例如：产品设计/数据分析"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="mbti">MBTI</Label>
                <Input
                  id="mbti"
                  value={formData.mbti}
                  onChange={(event) => updateFormData('mbti', event.target.value)}
                  placeholder="例如：INFJ"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="zodiac">星座</Label>
                <Input
                  id="zodiac"
                  value={formData.zodiac}
                  onChange={(event) => updateFormData('zodiac', event.target.value)}
                  placeholder="例如：双鱼座"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="selfIntro">一句话自我介绍</Label>
              <Textarea
                id="selfIntro"
                rows={3}
                value={formData.selfIntro}
                onChange={(event) => updateFormData('selfIntro', event.target.value)}
                placeholder="如果只留一句话，你希望别人怎么认识那时候的你？"
                className={sectionInputClass}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="howOthersSeeMe">别人通常怎么评价你</Label>
              <Textarea
                id="howOthersSeeMe"
                rows={3}
                value={formData.howOthersSeeMe}
                onChange={(event) => updateFormData('howOthersSeeMe', event.target.value)}
                placeholder="外界看到的你是什么样子？"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="realPersonality">你觉得自己真实是什么样的人</Label>
              <Textarea
                id="realPersonality"
                rows={3}
                value={formData.realPersonality}
                onChange={(event) => updateFormData('realPersonality', event.target.value)}
                placeholder="和别人眼里的你有哪些差别？"
                className={sectionInputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="strengths">你最认可自己的优点</Label>
                <Textarea
                  id="strengths"
                  rows={3}
                  value={formData.strengths}
                  onChange={(event) => updateFormData('strengths', event.target.value)}
                  placeholder="例如：稳定、细腻、执行力强"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="weaknesses">你最明显的缺点</Label>
                <Textarea
                  id="weaknesses"
                  rows={3}
                  value={formData.weaknesses}
                  onChange={(event) => updateFormData('weaknesses', event.target.value)}
                  placeholder="例如：容易内耗、拖延"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="emotionalPattern">难过或焦虑时通常怎么表现</Label>
              <Textarea
                id="emotionalPattern"
                rows={3}
                value={formData.emotionalPattern}
                onChange={(event) => updateFormData('emotionalPattern', event.target.value)}
                placeholder="例如：会沉默、会疯狂找人说话、会逃避信息"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="angerPattern">生气时通常怎么表现</Label>
              <Textarea
                id="angerPattern"
                rows={3}
                value={formData.angerPattern}
                onChange={(event) => updateFormData('angerPattern', event.target.value)}
                placeholder="例如：先压住，之后突然爆发"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="socialStyle">陌生人和熟人面前差别大不大</Label>
              <Textarea
                id="socialStyle"
                rows={3}
                value={formData.socialStyle}
                onChange={(event) => updateFormData('socialStyle', event.target.value)}
                placeholder="例如：熟人前很闹，陌生场合偏安静"
                className={sectionInputClass}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="speakingTone">说话风格</Label>
              <Input
                id="speakingTone"
                value={formData.speakingTone}
                onChange={(event) => updateFormData('speakingTone', event.target.value)}
                placeholder="例如：温柔、直接、理性、嘴硬心软"
                className={sectionInputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="comfortStyle">安慰方式</Label>
                <Input
                  id="comfortStyle"
                  value={formData.comfortStyle}
                  onChange={(event) => updateFormData('comfortStyle', event.target.value)}
                  placeholder="例如：先共情，再分析"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="sentenceStyle">句子习惯</Label>
                <Input
                  id="sentenceStyle"
                  value={formData.sentenceStyle}
                  onChange={(event) => updateFormData('sentenceStyle', event.target.value)}
                  placeholder="例如：短句、语速快"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="catchphrases">常用口头禅</Label>
              <Textarea
                id="catchphrases"
                rows={3}
                value={formData.catchphrases}
                onChange={(event) => updateFormData('catchphrases', event.target.value)}
                placeholder="例如：算了吧、先这样、慢慢来"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="chatHabit">聊天常用语气词</Label>
              <Input
                id="chatHabit"
                value={formData.chatHabit}
                onChange={(event) => updateFormData('chatHabit', event.target.value)}
                placeholder="例如：哈哈、欸、呜呜、笑死"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="desiredCloneTone">希望分身更像哪种你</Label>
              <Input
                id="desiredCloneTone"
                value={formData.desiredCloneTone}
                onChange={(event) => updateFormData('desiredCloneTone', event.target.value)}
                placeholder="例如：真实的我 / 更温柔版我 / 更成熟版我"
                className={sectionInputClass}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="friendshipView">你对朋友通常是什么样</Label>
              <Textarea
                id="friendshipView"
                rows={3}
                value={formData.friendshipView}
                onChange={(event) => updateFormData('friendshipView', event.target.value)}
                placeholder="你在友情里通常扮演什么角色？"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="familyView">你和家人的关系状态</Label>
              <Textarea
                id="familyView"
                rows={3}
                value={formData.familyView}
                onChange={(event) => updateFormData('familyView', event.target.value)}
                placeholder="亲密、疏离、复杂，或正在修复中？"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="loveView">感情观</Label>
              <Textarea
                id="loveView"
                rows={3}
                value={formData.loveView}
                onChange={(event) => updateFormData('loveView', event.target.value)}
                placeholder="你现在如何看待亲密关系？"
                className={sectionInputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="biggestFear">最害怕失去什么</Label>
                <Textarea
                  id="biggestFear"
                  rows={3}
                  value={formData.biggestFear}
                  onChange={(event) => updateFormData('biggestFear', event.target.value)}
                  placeholder="可以是人、机会、状态或某种能力"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="mostWantedToBeRememberedFor">最希望别人记住你什么</Label>
                <Textarea
                  id="mostWantedToBeRememberedFor"
                  rows={3}
                  value={formData.mostWantedToBeRememberedFor}
                  onChange={(event) => updateFormData('mostWantedToBeRememberedFor', event.target.value)}
                  placeholder="你想留下的印象"
                  className={sectionInputClass}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="misunderstoodPoint">你最常被误解的一点</Label>
              <Textarea
                id="misunderstoodPoint"
                rows={3}
                value={formData.misunderstoodPoint}
                onChange={(event) => updateFormData('misunderstoodPoint', event.target.value)}
                placeholder="别人经常误解你的地方"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="coreBeliefs">当前最相信的几件事</Label>
              <Textarea
                id="coreBeliefs"
                rows={3}
                value={formData.coreBeliefs}
                onChange={(event) => updateFormData('coreBeliefs', event.target.value)}
                placeholder="你现在坚持的原则和信念"
                className={sectionInputClass}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <Label htmlFor="currentTroubles">最近最困扰你的问题</Label>
              <Textarea
                id="currentTroubles"
                rows={3}
                value={formData.currentTroubles}
                onChange={(event) => updateFormData('currentTroubles', event.target.value)}
                placeholder="越真实越好"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="currentGoals">现在最想实现的目标</Label>
              <Textarea
                id="currentGoals"
                rows={3}
                value={formData.currentGoals}
                onChange={(event) => updateFormData('currentGoals', event.target.value)}
                placeholder="现在最在意什么结果？"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="recentImportantThings">今年最重要的 3 件事</Label>
              <Textarea
                id="recentImportantThings"
                rows={3}
                value={formData.recentImportantThings}
                onChange={(event) => updateFormData('recentImportantThings', event.target.value)}
                placeholder="可以分行填写"
                className={sectionInputClass}
              />
            </div>
            <div>
              <Label htmlFor="messageToFuture">写给未来自己的话</Label>
              <Textarea
                id="messageToFuture"
                rows={3}
                value={formData.messageToFuture}
                onChange={(event) => updateFormData('messageToFuture', event.target.value)}
                placeholder="想告诉未来的自己什么？"
                className={sectionInputClass}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="currentMood">你现在处于什么状态</Label>
                <Input
                  id="currentMood"
                  value={formData.currentMood}
                  onChange={(event) => updateFormData('currentMood', event.target.value)}
                  placeholder="例如：迷茫但清醒"
                  className={sectionInputClass}
                />
              </div>
              <div>
                <Label htmlFor="whatThisPeriodMeans">这个阶段对你的意义</Label>
                <Input
                  id="whatThisPeriodMeans"
                  value={formData.whatThisPeriodMeans}
                  onChange={(event) => updateFormData('whatThisPeriodMeans', event.target.value)}
                  placeholder="例如：真正学会独立"
                  className={sectionInputClass}
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-purple-400/30 bg-white/5 p-4">
              <div className="mb-4 flex items-center gap-3">
                <UserRound className="h-5 w-5 text-purple-300" />
                <p className="text-sm text-purple-100">
                  上传头像后，这张脸会出现在“那个时间点的你”的档案卡和聊天头像里。
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <Image
                  src={avatarPreview}
                  alt="头像预览"
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 rounded-full border border-purple-300/60 object-cover"
                />
                <div className="space-y-3">
                  <label className="inline-flex cursor-pointer items-center rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700">
                    <Upload className="mr-2 h-4 w-4" />
                    上传头像
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        updateFormData('avatarDataUrl', '');
                        updateFormData('avatarMimeType', '');
                      }}
                      className="h-8 px-0 text-purple-200/70 hover:bg-transparent hover:text-purple-100"
                    >
                      使用默认头像
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border border-purple-400/20 bg-white/5 p-4">
              <p className="text-sm text-purple-200/80">
                这一步仅做本地保存和展示。后续可以在此基础上扩展“AI 分身头像生成”和“声音克隆”能力。
              </p>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-white">保存这个时间点的自己</h1>
          <p className="text-purple-200">这份问卷会成为“那个时候的你”的人格底稿。</p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-purple-400/20 bg-white/5 p-3 md:grid-cols-6">
          {steps.map((step, index) => {
            const active = index === currentStep;
            const completed = index < currentStep;
            return (
              <div key={step.id} className="flex items-center gap-2 rounded-lg px-2 py-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    active
                      ? 'bg-purple-600 text-white'
                      : completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-purple-200'
                  }`}
                >
                  {completed ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
                </div>
                <span className={`text-xs ${active ? 'text-white' : 'text-purple-200/70'}`}>{step.title}</span>
              </div>
            );
          })}
        </div>

        <Card className="border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {steps[currentStep].icon} {steps[currentStep].title}
            </h2>
            <p className="mt-1 text-sm text-purple-200/80">{steps[currentStep].description}</p>
            <p className="mt-2 text-xs text-purple-300/60">
              {currentStep + 1} / {steps.length}（草稿自动保存）
            </p>
          </div>

          {renderStep()}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一步
            </Button>
            <Button onClick={handleNext} className="bg-purple-600 text-white hover:bg-purple-700">
              {currentStep === steps.length - 1 ? '完成问卷，去记录经历' : '下一步'}
              {currentStep < steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/life-events')}
            className="text-purple-300/70 hover:text-purple-100"
          >
            先去记录人生事件，稍后再补问卷
          </Button>
        </div>
      </div>
    </div>
  );
}
