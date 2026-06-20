import {
  FileCheck2,
  Clock,
  Users2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  FileText,
  Hourglass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { REQUEST_STATUS_MAP, NODE_STATUS_MAP, QUEUE_STATUS_MAP, SECRECY_LEVEL_MAP } from '@/types';
import { formatTime, formatRelativeTime, formatCountdown } from '@/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    archiveRequests,
    approvalNodes,
    queueNumbers,
    reminderLogs,
    overtimeRecords,
  } = useAppStore();

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingApprovals = approvalNodes.filter((n) => n.status === 'pending' || n.status === 'timeout' || n.status === 'escalated').length;
  const waitingQueue = queueNumbers.filter((q) => q.status === 'waiting').length;
  const timeoutWarnings = reminderLogs.filter((r) => !r.acknowledged).length;
  const todayOvertime = overtimeRecords.length;

  const myPendingNodes = approvalNodes
    .filter((n) => n.status === 'pending' || n.status === 'timeout' || n.status === 'escalated')
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 5);

  const recentRequests = [...archiveRequests]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const currentCalling = queueNumbers.find((q) => q.status === 'calling');
  const nextWaiting = [...queueNumbers]
    .filter((q) => q.status === 'waiting')
    .sort((a, b) => a.sequence - b.sequence)
    .slice(0, 3);

  const stats = [
    {
      label: '待审批节点',
      value: pendingApprovals,
      change: '+2',
      trend: 'up' as const,
      icon: FileCheck2,
      color: 'from-blue-500 to-blue-700',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      onClick: () => navigate('/approval'),
    },
    {
      label: '超时催办',
      value: timeoutWarnings,
      change: '+1',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      onClick: () => navigate('/reminder'),
    },
    {
      label: '排队等待',
      value: waitingQueue,
      change: '0',
      trend: 'flat' as const,
      icon: Users2,
      color: 'from-purple-500 to-purple-700',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-700',
      onClick: () => navigate('/queue/manage'),
    },
    {
      label: '今日过号',
      value: todayOvertime,
      change: '-1',
      trend: 'down' as const,
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-700',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-700',
      onClick: () => navigate('/overtime'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
          <p className="text-sm text-slate-500 mt-1">欢迎回来，今天是 {formatTime(Date.now()).split(' ')[0]}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/approval/new')} className="btn-primary">
            <FileText className="w-4 h-4" />
            发起调卷
          </button>
          <button onClick={() => navigate('/queue/take')} className="btn-secondary">
            <Users2 className="w-4 h-4" />
            取号排队
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              onClick={s.onClick}
              className="stat-card hover:shadow-card-hover cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">{s.value}</span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      s.trend === 'up' ? 'text-red-600' : s.trend === 'down' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {s.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : s.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {s.change}
                    </span>
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className={`mt-4 flex items-center justify-between text-xs ${s.textColor} ${s.bgLight} rounded-lg px-2.5 py-1.5`}>
                <span>查看详情</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 左侧：待办事项 */}
        <div className="xl:col-span-2 space-y-5">
          {/* 我的待办审批 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-amber-500" />
                待办审批节点
              </h3>
              <button onClick={() => navigate('/approval')} className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1">
                全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {myPendingNodes.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">暂无待办审批</div>
              ) : (
                myPendingNodes.map((node) => {
                  const req = archiveRequests.find((r) => r.id === node.requestId);
                  const cd = formatCountdown(node.deadline);
                  return (
                    <div
                      key={node.id}
                      onClick={() => navigate(`/approval/${node.requestId}`)}
                      className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          node.status === 'timeout' || node.status === 'escalated'
                            ? 'bg-red-50'
                            : cd.isWarning
                            ? 'bg-amber-50'
                            : 'bg-blue-50'
                        }`}>
                          {node.status === 'timeout' || node.status === 'escalated' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Hourglass className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 truncate">{req?.title}</span>
                            {req && (
                              <span className={`badge ${SECRECY_LEVEL_MAP[req.secrecyLevel].bgColor} ${SECRECY_LEVEL_MAP[req.secrecyLevel].color} border`}>
                                {SECRECY_LEVEL_MAP[req.secrecyLevel].label}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            节点：{node.nodeName} · 审批人：{node.approverName}（{node.approverTitle}）
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-sm font-semibold ${
                            cd.isOverdue ? 'text-red-600 animate-blink' : cd.isWarning ? 'text-amber-600' : 'text-slate-700'
                          }`}>
                            {cd.isOverdue ? '已超时' : cd.text}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            截止 {formatTime(node.deadline)}
                          </div>
                        </div>
                        <div className={`badge ${NODE_STATUS_MAP[node.status].dotColor.replace('bg-', 'bg-').replace('-500', '-100')} ${NODE_STATUS_MAP[node.status].color.replace('text-', 'text-')} border-0`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${NODE_STATUS_MAP[node.status].dotColor} mr-1.5 ${node.status === 'pending' ? 'animate-pulse' : ''}`} />
                          {NODE_STATUS_MAP[node.status].label}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 最近申请 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                最近调卷申请
              </h3>
              <button onClick={() => navigate('/approval')} className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1">
                全部 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {recentRequests.map((req) => {
                const status = REQUEST_STATUS_MAP[req.status];
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/approval/${req.id}`)}
                    className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">{req.title}</span>
                          <span className={`badge ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span className="font-mono">{req.archiveNo}</span>
                          <span>申请人：{req.userName}</span>
                          <span>{formatRelativeTime(req.createdAt)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：排队信息 */}
        <div className="space-y-5">
          {/* 当前叫号 */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
              <div className="text-sm opacity-90 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                当前正在叫号
              </div>
              {currentCalling ? (
                <div className="mt-4">
                  <div className="text-6xl font-bold tracking-wider font-mono animate-pulse-slow">
                    {currentCalling.numberCode}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">{currentCalling.userName}</div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {currentCalling.calledAt ? formatRelativeTime(currentCalling.calledAt) : ''}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-sm font-medium">
                      {currentCalling.windowNo && `${currentCalling.windowNo}号窗口`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 text-center py-6 opacity-70">
                  暂无叫号
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="text-sm font-medium text-slate-700 mb-3">即将叫号</div>
              {nextWaiting.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">暂无等待人员</div>
              ) : (
                <div className="space-y-2">
                  {nextWaiting.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-slate-900">{q.numberCode}</div>
                        <div className="text-xs text-slate-500">{q.userName}</div>
                      </div>
                      {q.overtimeCount > 0 && (
                        <span className="badge bg-orange-50 text-orange-700 border border-orange-200">
                          过号{q.overtimeCount}次
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/queue/manage')}
                className="mt-4 w-full btn-secondary text-sm"
              >
                <Settings2 className="w-4 h-4" />
                进入叫号管理
              </button>
            </div>
          </div>

          {/* 预警提示 */}
          {timeoutWarnings > 0 && (
            <div className="card border-amber-200 bg-amber-50/50">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900">超时预警</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      当前有 <span className="font-bold">{timeoutWarnings}</span> 条审批节点超时未处理，
                      请及时跟进避免影响业务流程。
                    </p>
                    <button
                      onClick={() => navigate('/reminder')}
                      className="mt-3 btn-warning text-xs py-1.5"
                    >
                      立即处理
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 队列统计 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900">队列状态统计</h3>
            </div>
            <div className="card-body space-y-3">
              {[
                { label: '等待中', count: queueNumbers.filter((q) => q.status === 'waiting').length, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                { label: '叫号中', count: queueNumbers.filter((q) => q.status === 'calling').length, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                { label: '办理中', count: queueNumbers.filter((q) => q.status === 'processing').length, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: '已作废', count: queueNumbers.filter((q) => q.status === 'invalid').length, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className={`text-sm ${s.text} flex-1`}>{s.label}</span>
                  <span className={`font-bold text-sm px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
