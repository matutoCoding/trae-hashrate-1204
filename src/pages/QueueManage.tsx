import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MonitorUp,
  Play,
  Volume2,
  SkipForward,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Users,
  ArrowLeft,
  Ticket,
  RefreshCw,
  Bell,
  Zap,
  AlertTriangle,
  Settings2,
  MonitorSpeaker,
  ChevronRight,
  CircleCheckBig,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { QUEUE_STATUS_MAP } from '@/types';
import { formatTime, formatRelativeTime, formatCountdown } from '@/utils';

export default function QueueManage() {
  const navigate = useNavigate();
  const {
    queueNumbers,
    callNextNumber,
    recallNumber,
    confirmProcessing,
    completeProcessing,
    markOvertime,
    requeueNumber,
    currentUserId,
  } = useAppStore();

  const [, setTick] = useState(0);
  const [windowNo, setWindowNo] = useState<number>(2);
  const [callHistory, setCallHistory] = useState<Array<{ numberCode: string; action: string; time: number }>>([]);
  const [showOvertimeModal, setShowOvertimeModal] = useState<null | { id: string; code: string }>(null);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentCalling = queueNumbers.find((q) => q.status === 'calling');
  const callingCountdown = currentCalling?.calledAt
    ? (() => {
        const elapsed = Date.now() - currentCalling.calledAt;
        const remain = Math.max(0, 3 * 60 * 1000 - elapsed);
        const m = Math.floor(remain / 60000);
        const s = Math.floor((remain % 60000) / 1000);
        return {
          text: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
          isOverdue: remain <= 0,
          percent: Math.min(100, (elapsed / (3 * 60 * 1000)) * 100),
        };
      })()
    : null;

  const waiting = [...queueNumbers]
    .filter((q) => q.status === 'waiting')
    .sort((a, b) => a.sequence - b.sequence);
  const processing = queueNumbers.filter((q) => q.status === 'processing');
  const completed = queueNumbers.filter((q) => q.status === 'completed');
  const invalid = queueNumbers.filter((q) => q.status === 'invalid');

  const addHistory = (numberCode: string, action: string) => {
    setCallHistory((h) => [{ numberCode, action, time: Date.now() }, ...h].slice(0, 20));
  };

  const handleCallNext = () => {
    const next = callNextNumber(windowNo);
    if (next) {
      addHistory(next.numberCode, `叫号（${windowNo}号窗口）`);
    }
  };

  const handleRecall = () => {
    if (currentCalling) {
      recallNumber(currentCalling.id);
      addHistory(currentCalling.numberCode, '重叫');
    }
  };

  const handleConfirmArrival = () => {
    if (currentCalling) {
      confirmProcessing(currentCalling.id);
      addHistory(currentCalling.numberCode, '确认到场，开始办理');
    }
  };

  const handleMarkOvertime = () => {
    if (!currentCalling) return;
    setShowOvertimeModal({ id: currentCalling.id, code: currentCalling.numberCode });
  };

  const confirmOvertime = () => {
    if (!showOvertimeModal) return;
    const result = markOvertime(showOvertimeModal.id);
    if (result.status === 'requeued') {
      requeueNumber(showOvertimeModal.id, '管理员');
      addHistory(showOvertimeModal.code, `判定过号（第${result.count}次），重排队尾`);
    } else {
      addHistory(showOvertimeModal.code, `连续过号${result.count}次，号码作废`);
    }
    setShowOvertimeModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/queue')} className="btn-secondary py-2 px-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-brand-500" />
              叫号管理台
            </h1>
            <p className="text-sm text-slate-500 mt-1">管理排队叫号流程，处理叫号、确认、过号等操作</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-500">当前窗口</span>
            <select
              className="border-0 bg-transparent text-sm font-medium text-slate-900 focus:outline-none focus:ring-0"
              value={windowNo}
              onChange={(e) => setWindowNo(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}号窗口</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => navigate('/queue')}
            className="btn-secondary"
          >
            <MonitorSpeaker className="w-4 h-4" />
            打开叫号大屏
          </button>
          <button onClick={() => navigate('/queue/take')} className="btn-primary">
            <Ticket className="w-4 h-4" />
            取号
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '等待中', value: waiting.length, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: '叫号中', value: currentCalling ? 1 : 0, icon: Bell, color: 'from-amber-500 to-orange-500' },
          { label: '办理中', value: processing.length, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
          { label: '已办结', value: completed.length, icon: CircleCheckBig, color: 'from-teal-500 to-teal-600' },
          { label: '已作废', value: invalid.length, icon: AlertTriangle, color: 'from-rose-500 to-red-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">{s.value}</div>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：叫号操作面板 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 当前叫号卡片 */}
          <div className={`card overflow-hidden ${callingCountdown?.isOverdue ? 'border-red-300' : 'border-amber-200'}`}>
            <div className={`h-2 ${callingCountdown?.isOverdue ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}>
              {callingCountdown && (
                <div
                  className="h-full bg-white/30 transition-all duration-1000"
                  style={{ width: `${100 - callingCountdown.percent}%` }}
                />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className={`w-5 h-5 ${callingCountdown?.isOverdue ? 'text-red-500 animate-blink' : 'text-amber-500 animate-pulse'}`} />
                <span className={`font-bold ${callingCountdown?.isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                  当前叫号状态
                </span>
              </div>

              {currentCalling ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center md:col-span-1">
                    <div className="text-sm text-slate-500 mb-1">当前号码</div>
                    <div className={`font-mono font-black tracking-wider text-7xl text-transparent bg-clip-text bg-gradient-to-br ${
                      callingCountdown?.isOverdue
                        ? 'from-red-500 to-rose-600'
                        : 'from-amber-500 to-orange-600'
                    } animate-pulse-slow`}>
                      {currentCalling.numberCode}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">申请人</div>
                        <div className="font-semibold text-slate-900 text-lg">{currentCalling.userName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">办理窗口</div>
                        <div className="font-semibold text-slate-900 text-lg">{currentCalling.windowNo}号窗口</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">叫号时间</div>
                        <div className="font-medium text-slate-700">{currentCalling.calledAt && formatTime(currentCalling.calledAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">叫号倒计时</div>
                        <div className={`font-mono font-bold text-2xl ${
                          callingCountdown?.isOverdue ? 'text-red-600 animate-blink' : 'text-slate-800'
                        }`}>
                          {callingCountdown?.text || '--:--'}
                        </div>
                      </div>
                    </div>
                    {currentCalling.overtimeCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4" />
                        该号码此前已过号 {currentCalling.overtimeCount} 次，再过号 {3 - currentCalling.overtimeCount} 次将作废
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MonitorUp className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 text-lg">当前没有正在叫号的号码</p>
                  <p className="text-slate-400 text-sm mt-1">点击下方"呼叫下一位"开始叫号</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={handleCallNext}
                  disabled={!!currentCalling || waiting.length === 0}
                  className="btn-primary py-3"
                >
                  <Play className="w-4 h-4" />
                  呼叫下一位
                </button>
                <button
                  onClick={handleRecall}
                  disabled={!currentCalling}
                  className="btn-secondary py-3"
                >
                  <Volume2 className="w-4 h-4" />
                  重新叫号
                </button>
                <button
                  onClick={handleConfirmArrival}
                  disabled={!currentCalling}
                  className="btn-success py-3"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认到场
                </button>
                <button
                  onClick={handleMarkOvertime}
                  disabled={!currentCalling}
                  className="btn-danger py-3"
                >
                  <AlertTriangle className="w-4 h-4" />
                  判定过号
                </button>
              </div>
            </div>
          </div>

          {/* 等待队列表格 */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                等待队列
                <span className="badge bg-blue-50 text-blue-700">{waiting.length}人</span>
              </h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>号码</th>
                    <th>申请人</th>
                    <th>取号时间</th>
                    <th>等待时长</th>
                    <th>过号次数</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {waiting.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        等待队列为空
                      </td>
                    </tr>
                  ) : (
                    waiting.map((q, idx) => (
                      <tr key={q.id} className={idx === 0 ? 'bg-blue-50/50' : ''}>
                        <td>
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            idx === 0
                              ? 'bg-brand-500 text-white'
                              : idx === 1
                              ? 'bg-slate-400 text-white'
                              : idx === 2
                              ? 'bg-orange-400 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono font-bold text-lg text-slate-900">{q.numberCode}</span>
                        </td>
                        <td>
                          <div className="font-medium text-slate-800">{q.userName}</div>
                        </td>
                        <td className="text-slate-600">{formatTime(q.takenAt)}</td>
                        <td>
                          <span className="font-mono text-sm text-slate-700">
                            {formatRelativeTime(q.takenAt)}
                          </span>
                        </td>
                        <td>
                          {q.overtimeCount === 0 ? (
                            <span className="text-slate-400 text-sm">-</span>
                          ) : (
                            <span className={`badge ${q.overtimeCount >= 2 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                              {q.overtimeCount}次
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${QUEUE_STATUS_MAP[q.status].bgColor} ${QUEUE_STATUS_MAP[q.status].color}`}>
                            {idx === 0 && <Zap className="w-3 h-3 mr-1 text-amber-500 animate-pulse" />}
                            {QUEUE_STATUS_MAP[q.status].label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右侧：操作记录 + 办理中 */}
        <div className="space-y-6">
          {/* 办理中列表 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                办理中
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {processing.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">暂无办理中</div>
              ) : (
                processing.map((p) => (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                      <span className="font-mono font-black text-white">{p.numberCode}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{p.userName}</div>
                      <div className="text-xs text-slate-500">
                        {p.windowNo}号窗口 · {formatRelativeTime(p.calledAt || p.takenAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        completeProcessing(p.id);
                        addHistory(p.numberCode, '办理完成');
                      }}
                      className="btn-success py-1.5 px-3 text-xs"
                    >
                      <CircleCheckBig className="w-3.5 h-3.5" />
                      办理完成
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {completed.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CircleCheckBig className="w-4 h-4 text-teal-500" />
                  已办结
                  <span className="badge bg-teal-50 text-teal-700">{completed.length}</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {completed.map((p) => (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
                        <span className="font-mono font-black text-white">{p.numberCode}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{p.userName}</div>
                        <div className="text-xs text-slate-500">
                          {p.windowNo}号窗口 · 完成于 {p.completedAt && formatTime(p.completedAt)}
                        </div>
                      </div>
                      <span className="badge bg-teal-50 text-teal-700">
                        <CircleCheckBig className="w-3 h-3 mr-1" />
                        已办结
                      </span>
                    </div>
                    {p.summary && (
                      <div className="ml-15 pl-4 border-l-2 border-teal-100 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="rounded-lg bg-teal-50 border border-teal-100 p-2">
                          <div className="text-[10px] text-teal-700 font-medium">等待/办理</div>
                          <div className="text-sm font-bold text-teal-800">
                            {p.summary.waitingDurationMinutes}分 / {p.summary.processingDurationMinutes}分
                          </div>
                        </div>
                        <div className="rounded-lg bg-teal-50 border border-teal-100 p-2">
                          <div className="text-[10px] text-teal-700 font-medium">总耗时</div>
                          <div className="text-sm font-bold text-teal-800">{p.summary.totalDurationMinutes}分</div>
                        </div>
                        <div className="rounded-lg bg-teal-50 border border-teal-100 p-2">
                          <div className="text-[10px] text-teal-700 font-medium">审批节点</div>
                          <div className="text-sm font-bold text-teal-800">{p.summary.approvalNodeCount}个</div>
                        </div>
                        <div className="rounded-lg bg-teal-50 border border-teal-100 p-2">
                          <div className="text-[10px] text-teal-700 font-medium">过号</div>
                          <div className="text-sm font-bold text-teal-800">{p.summary.overtimeOccurred ? p.summary.overtimeCount + '次' : '无'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作记录时间线 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-500" />
                叫号操作记录
              </h3>
              <span className="text-xs text-slate-400">最近20条</span>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {callHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  暂无操作记录
                </div>
              ) : (
                <div className="space-y-1">
                  {callHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="relative pl-8 py-2.5 first:pt-0"
                    >
                      <div className="absolute left-0 top-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-md text-[10px] font-bold text-white">
                        {idx + 1}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-sm text-slate-900">{h.numberCode}</span>
                          <span className="text-sm text-slate-600 ml-2">{h.action}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatTime(h.time)} · {formatRelativeTime(h.time)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 过号确认弹窗 */}
      {showOvertimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-orange-900">确认判定过号</h3>
                <p className="text-sm text-orange-700 mt-0.5">号码 {showOvertimeModal.code} 叫号未到场</p>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4">
                <div className="text-sm text-orange-900 leading-relaxed">
                  根据过号处理规则：
                  <ul className="mt-2 space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>首次/二次过号：号码重新排至队尾，过号次数+1</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>连续3次过号：号码<span className="font-bold text-red-600">自动作废</span>，需重新取号</span>
                    </li>
                  </ul>
                </div>
              </div>
              {currentCalling && currentCalling.overtimeCount >= 2 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>该号码已过号 {currentCalling.overtimeCount} 次，本次判定过号后将<strong>自动作废</strong>！</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowOvertimeModal(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={confirmOvertime} className="btn-danger">
                <AlertTriangle className="w-4 h-4" />
                确认判定过号
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
