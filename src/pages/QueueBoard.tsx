import { useState, useEffect } from 'react';
import {
  MonitorSpeaker,
  Volume2,
  Users,
  Clock,
  Bell,
  RefreshCw,
  MonitorUp,
  Maximize2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { QUEUE_STATUS_MAP } from '@/types';
import { formatRelativeTime, formatTime } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function QueueBoard() {
  const navigate = useNavigate();
  const { queueNumbers } = useAppStore();
  const [, setTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentCalling = queueNumbers.find((q) => q.status === 'calling');
  const processing = queueNumbers.filter((q) => q.status === 'processing');
  const waiting = [...queueNumbers]
    .filter((q) => q.status === 'waiting')
    .sort((a, b) => a.sequence - b.sequence);

  const waitingDisplay = waiting.slice(0, 8);
  const waitingCount = waiting.length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-full -m-6 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900">
      <div className="min-h-full p-6 lg:p-10">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-2xl shadow-brand-500/30">
              <MonitorSpeaker className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-wide">
                档案查阅叫号大屏
              </h1>
              <p className="text-brand-200 text-sm lg:text-base mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatTime(Date.now())}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTick((t) => t + 1)}
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/queue/manage')}
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <MonitorUp className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 当前叫号区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 主叫号卡片 */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-1 shadow-2xl">
            <div className="rounded-[22px] bg-gradient-to-br from-slate-900/95 to-slate-800/95 p-8 lg:p-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Bell className="w-6 h-6 animate-bounce" />
                  <span className="text-xl font-bold tracking-wider animate-pulse">正在叫号</span>
                  <span className="text-lg">NOW CALLING</span>
                </div>
                {currentCalling?.windowNo && (
                  <div className="px-5 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                    <div className="text-xs text-brand-200">办理窗口</div>
                    <div className="text-2xl font-bold text-white">{currentCalling.windowNo}号窗口</div>
                  </div>
                )}
              </div>

              {currentCalling ? (
                <div className="mt-8 lg:mt-10">
                  <div className="text-center">
                    <div className="font-mono text-[6rem] lg:text-[9rem] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 animate-pulse-slow leading-none">
                      {currentCalling.numberCode}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-6 text-white">
                      <div className="text-2xl lg:text-3xl font-semibold">{currentCalling.userName}</div>
                      {currentCalling.overtimeCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-500/30 border border-red-400/50 text-red-300 text-sm">
                          过号{currentCalling.overtimeCount}次
                        </span>
                      )}
                    </div>
                    {currentCalling.calledAt && (
                      <div className="mt-4 text-brand-200 text-sm lg:text-base flex items-center justify-center gap-2">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        {formatRelativeTime(currentCalling.calledAt)}叫号
                        <span className="mx-2">·</span>
                        <span className={`font-mono font-semibold ${
                          currentCalling.calledAt && Date.now() - currentCalling.calledAt > 3 * 60 * 1000
                            ? 'text-red-400 animate-blink'
                            : 'text-amber-300'
                        }`}>
                          {currentCalling.calledAt ? (
                            (() => {
                              const diff = Math.floor((Date.now() - currentCalling.calledAt) / 1000);
                              const m = Math.floor(diff / 60);
                              const s = diff % 60;
                              return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                            })()
                          ) : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-16 py-16 text-center">
                  <MonitorSpeaker className="w-24 h-24 mx-auto text-white/20 mb-6" />
                  <p className="text-2xl text-white/50">暂无叫号</p>
                  <p className="text-brand-300 text-sm mt-2">等待管理员开始叫号</p>
                </div>
              )}
            </div>
          </div>

          {/* 办理中 + 统计 */}
          <div className="space-y-6">
            {/* 办理中 */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 backdrop-blur border border-emerald-400/30 p-6">
              <div className="flex items-center gap-2 text-emerald-300 mb-4">
                <Users className="w-5 h-5" />
                <span className="font-bold tracking-wide">正在办理</span>
              </div>
              {processing.length === 0 ? (
                <div className="py-8 text-center text-emerald-200/50 text-sm">
                  暂无办理中的业务
                </div>
              ) : (
                <div className="space-y-3">
                  {processing.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <span className="font-mono font-black text-2xl text-white">{p.numberCode}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-lg">{p.userName}</div>
                        <div className="text-emerald-200/70 text-xs mt-1">
                          {p.windowNo && `${p.windowNo}号窗口 `}
                          {p.calledAt && `· ${formatRelativeTime(p.calledAt)}开始`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 统计数字 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5">
                <div className="text-brand-200/70 text-xs mb-1">等待人数</div>
                <div className="text-4xl font-black text-white font-mono tracking-wider">{waitingCount}</div>
                <div className="text-brand-200/50 text-xs mt-1">人在队列中</div>
              </div>
              <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5">
                <div className="text-brand-200/70 text-xs mb-1">预计等待</div>
                <div className="text-4xl font-black text-white font-mono tracking-wider">
                  {waitingCount > 0 ? `${waitingCount * 8}` : '0'}
                </div>
                <div className="text-brand-200/50 text-xs mt-1">分钟（约）</div>
              </div>
            </div>
          </div>
        </div>

        {/* 等待队列 */}
        <div className="rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-brand-400" />
              等待队列
              <span className="px-3 py-1 rounded-full bg-brand-500/30 text-brand-200 text-sm font-semibold">
                共 {waitingCount} 人
              </span>
            </h2>
            {waitingCount > waitingDisplay.length && (
              <span className="text-brand-200/60 text-sm">仅显示前 {waitingDisplay.length} 位</span>
            )}
          </div>

          {waiting.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto text-white/10 mb-4" />
              <p className="text-white/40 text-lg">当前等待队列为空</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {waitingDisplay.map((q, idx) => (
                <div
                  key={q.id}
                  className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 ${
                    idx === 0
                      ? 'bg-gradient-to-br from-brand-500/40 to-brand-700/40 border-2 border-brand-400/60 shadow-xl shadow-brand-500/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* 序号 */}
                  <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-900'
                      : idx === 1
                      ? 'bg-slate-400/50 text-white'
                      : idx === 2
                      ? 'bg-orange-400/50 text-white'
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {idx === 0 ? '下一位' : `#${idx + 1}`}
                  </div>

                  <div className="font-mono text-3xl lg:text-4xl font-black text-white tracking-wider mb-2">
                    {q.numberCode}
                  </div>
                  <div className="text-white font-medium text-sm lg:text-base">{q.userName}</div>
                  <div className="text-brand-200/50 text-xs mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(q.takenAt)}取号
                  </div>
                  {q.overtimeCount > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/30 border border-red-400/40 text-red-200 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      过号{q.overtimeCount}次
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="mt-3 text-amber-300 text-xs font-medium animate-pulse">
                      → 请做好准备
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 flex items-center justify-between text-brand-200/50 text-xs lg:text-sm flex-wrap gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              请留意叫号，过号将重排队尾
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              连续3次过号号码作废
            </span>
          </div>
          <div>
            点击右上角进入 <button onClick={() => navigate('/queue/manage')} className="text-brand-300 hover:text-white underline">叫号管理 &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
