'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Clock, MessageSquare, Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Clock className="h-20 w-20 text-purple-400 animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">
            时间胶囊
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            把某个时间点的自己，永久保存下来
          </p>
          <p className="text-sm text-purple-300/70 max-w-xl mx-auto">
            你会填写真实人格问卷、记录人生事件、上传头像，生成“那个时候的你”并与之对话。
            文件还在，那个时候的你就还在。
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-white/5 backdrop-blur-sm border-purple-500/20 p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">深度记录</h3>
              <p className="text-sm text-purple-200/70">
                记录语言习惯、阶段状态和关系观，建立真实的人格档案
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-purple-500/20 p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">阶段对话</h3>
              <p className="text-sm text-purple-200/70">
                和那个时间点的自己聊天，复盘当时在想什么、怕什么、坚持什么
              </p>
            </div>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-purple-500/20 p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Download className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">永久保存</h3>
              <p className="text-sm text-purple-200/70">
                导出人格提示词与记忆档案，把这个阶段完整留住
              </p>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-12">
          <Button
            size="lg"
            onClick={() => router.push('/questionnaire')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-12 py-6 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 group"
          >
            开始保存这个阶段的自己
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/import')}
              className="border-purple-500/30 text-purple-200 hover:bg-purple-500/10 text-base px-8 py-4 rounded-full"
            >
              <Upload className="mr-2 h-5 w-5" />
              导入已保存的阶段档案
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 mt-12 text-center">
          <div>
            <div className="text-3xl font-bold text-white">6</div>
            <div className="text-sm text-purple-300/70">个档案步骤</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">30+</div>
            <div className="text-sm text-purple-300/70">人格采集项</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">∞</div>
            <div className="text-sm text-purple-300/70">可持续回看</div>
          </div>
        </div>
      </div>
    </div>
  );
}
