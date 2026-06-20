import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Shield,
  User,
  Building,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Ticket,
  Hourglass,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Timer,
  Bell,
  BellRing,
  ArrowUpRight,
  RotateCcw,
  Volume2,
  UserCheck,
  CheckCircle,
  AlertOctagon,
  Users,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { REQUEST_STATUS_MAP, SECRECY_LEVEL_MAP, AUDIT_ACTION_LABELS } from '@/types';
import { formatTime, formatRelativeTime, REMINDER_HANDLER_TYPE_LABEL } from '@/utils';

const AUDIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  ShieldCheck: CheckCircle2,
  ShieldX: XCircle,
  Timer,
  CheckCircle: CheckCircle2,
  CheckCircle2,
  XCircle,
  Bell,
  ArrowUpRight,
  BellRing,
  Ticket,
  Volume2,
  UserCheck,
  AlertTriangle,
  RotateCcw,
};

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { archiveRequests, approvalNodes, reminderLogs, auditLogs, queueNumbers, approveNode, rejectNode, takeNumber, acknowledgeReminder, currentUserId } = useAppStore();
  const [, setTick] = useState(0);
  const [showOpinionModal, setShowOpinionModal] = useState<null | 'approve' | 'reject'>(null);
  const [opinion, setOpinion] = useState('');
  const [takeNumberMsg, setTakeNumberMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const req = archiveRequests.find((r) => r.id === id);
  const nodes = approvalNodes
    .filter((n) => n.requestId === id)
    .sort((a, b) => a.nodeOrder - b.nodeOrder);
  const reminders = reminderLogs.filter((r) => r.requestId === id);
  const requestQueueNumbers = queueNumbers.filter((q) => q.requestId === id).sort((a, b) => a.takenAt - b.takenAt);
  const requestAuditLogs = auditLogs
    .filter((a) => a.requestId === id)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!req) {
    return (
      <div className="text-center py-20">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 mb-4">未找到该调卷申请</p>
        <button onClick={() => navigate('/approval')} className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
      </div>
    );
  }

  const status = REQUEST_STATUS_MAP[req.status];
  const secrecy = SECRECY_LEVEL_MAP[req.secrecyLevel];
  const userSecrecy = SECRECY_LEVEL_MAP[req.userClearance];

  const activeNode = nodes.find((n) => n.nodeOrder === req.currentNode && (n.status === 'active' || n.status === 'timeout' || n.status === 'escalated'));
  const isCurrentApprover = activeNode && activeNode.approverId === currentUserId;

  const handleApprove = () => {
    if (!activeNode || !opinion.trim()) return;
    approveNode(req.id, activeNode.nodeOrder, opinion.trim());
    setShowOpinionModal(null);
    setOpinion('');
  };

  const handleReject = () => {
    if (!activeNode || !opinion.trim()) return;
    rejectNode(req.id, activeNode.nodeOrder, opinion.trim());
    setShowOpinionModal(null);
    setOpinion('');
  };

  const handleTakeNumber = () => {
    const res = takeNumber(req.id, req.userId, req.userName);
    setTakeNumberMsg(res.message);
    if (res.success && res.numberCode) {
      setTakeNumberMsg(`取号成功！您的号码是 ${res.numberCode}`);
      setTimeout(() => {
        navigate('/queue');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/approval')} className="btn-secondary py-2 px-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{req.title}</h1>
              <span className={`badge ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">申请编号：<span className="font-mono">{req.id}</span> · {formatRelativeTime(req.createdAt)}提交</p>
          </div>
        </div>
        <div className="flex gap-2">
          {req.status === 'approved' && (
            <button onClick={handleTakeNumber} className="btn-success">
              <Ticket className="w-4 h-4" />
              取号排队
            </button>
          )}
          {isCurrentApprover && (
            <>
              <button
                onClick={() => setShowOpinionModal('reject')}
                className="btn-danger"
              >
                <ThumbsDown className="w-4 h-4" />
                驳回申请
              </button>
              <button
                onClick={() => setShowOpinionModal('approve')}
                className="btn-primary"
              >
                <ThumbsUp className="w-4 h-4" />
                通过审批
              </button>
            </>
          )}
        </div>
      </div>

      {takeNumberMsg && (
        <div className="card border-emerald-200 bg-emerald-50/50">
          <div className="p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{takeNumberMsg}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
              <div className="flex items-center gap-2 text-sm opacity-90">
                <FileText className="w-4 h-4" />
                档案信息
              </div>
              <div className="mt-3 font-mono text-lg font-bold tracking-wide">{req.archiveNo}</div>
              <div className="mt-1 text-sm opacity-90">{req.archiveName}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur`}>
                  <Shield className="w-3 h-3" />
                  {secrecy.label}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1">调卷事由</div>
                <p className="text-sm text-slate-700 leading-relaxed">{req.reason}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">借阅期限：</span>
                <span className="font-medium text-slate-700">{req.borrowPeriod}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                申请人信息
              </h3>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold">
                  {req.userName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{req.userName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3" />
                    {req.userDepartment}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">用户权限等级</span>
                  <span className={`badge border ${userSecrecy.bgColor} ${userSecrecy.color}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {userSecrecy.label}（Lv.{userSecrecy.level}）
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-3">
                  <span className="text-slate-500">权限核验</span>
                  {userSecrecy.level >= secrecy.level ? (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      核验通过
                    </span>
                  ) : (
                    <span className="badge bg-red-50 text-red-700">
                      <XCircle className="w-3 h-3 mr-1" />
                      核验不通过
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {reminders.length > 0 && (
            <div className="card border-amber-200">
              <div className="card-header border-amber-100">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  催办记录
                  <span className="badge bg-amber-100 text-amber-700">{reminders.length}</span>
                </h3>
              </div>
              <div className="divide-y divide-amber-100">
                {reminders.map((r, idx) => (
                  <div key={r.id} className="p-4 bg-amber-50/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        Lv.{r.escalationLevel}
                      </span>
                      <span className="text-xs text-slate-500">第{idx + 1}次催办</span>
                      <span className="ml-auto text-[11px] text-slate-400">{formatTime(r.triggeredAt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{r.content}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        责任人：<span className="font-medium text-slate-700">{r.handlerName}（{r.handlerTitle}）</span>
                      </span>
                      {r.acknowledged ? (
                        <span className="badge bg-emerald-50 text-emerald-600 text-[10px]">
                          已签收 · {r.acknowledgedAt && formatTime(r.acknowledgedAt)}
                        </span>
                      ) : (
                        <span className="badge bg-red-50 text-red-600 text-[10px] animate-pulse">
                          待签收
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestQueueNumbers.length > 0 && (
            <div className="card border-emerald-200">
              <div className="card-header border-emerald-100">
                <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  办理轨迹
                  <span className="badge bg-emerald-100 text-emerald-700">{requestQueueNumbers.length} 个号码</span>
                </h3>
              </div>
              <div className="divide-y divide-emerald-100">
                {requestQueueNumbers.map((q) => (
                  <div key={q.id} className="p-4 bg-emerald-50/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-white">
                        {q.numberCode}
                      </span>
                      <span className="text-xs text-slate-500">序号 {q.sequence}</span>
                      {q.windowNo && (
                        <span className="ml-auto text-[11px] text-slate-400">窗口 {q.windowNo}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Ticket className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        <span className="text-slate-500 w-16">取号排队</span>
                        <span className="font-medium text-slate-700">{formatTime(q.takenAt)}</span>
                      </div>
                      {q.calledAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <Volume2 className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span className="text-slate-500 w-16">系统叫号</span>
                          <span className="font-medium text-slate-700">{formatTime(q.calledAt)}</span>
                        </div>
                      )}
                      {q.processingAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <UserCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-500 w-16">确认到场</span>
                          <span className="font-medium text-slate-700">{formatTime(q.processingAt)}</span>
                        </div>
                      )}
                      {q.completedAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="text-slate-500 w-16">办理完成</span>
                          <span className="font-medium text-slate-700">{formatTime(q.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestQueueNumbers.some((q) => q.summary) && (
            <div className="card border-slate-300 bg-gradient-to-br from-slate-50 to-emerald-50/40">
              <div className="card-header border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  办结小结
                </h3>
                <button
                  onClick={() => navigate('/completion-review')}
                  className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <BarChart3 className="w-3 h-3" />
                  全部复盘
                </button>
              </div>
              {requestQueueNumbers.filter((q) => q.summary).map((q) => {
                const s = q.summary!;
                return (
                  <div key={q.id} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                          <Hourglass className="w-3 h-3" />
                          等待叫号
                        </div>
                        <div className="text-xl font-bold text-slate-800">{s.waitingDurationMinutes}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                          <Activity className="w-3 h-3" />
                          办理时长
                        </div>
                        <div className="text-xl font-bold text-emerald-700">{s.processingDurationMinutes}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                          <Timer className="w-3 h-3" />
                          总耗时
                        </div>
                        <div className="text-xl font-bold text-slate-800">{s.totalDurationMinutes}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                          {s.overtimeOccurred ? <AlertOctagon className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          过号情况
                        </div>
                        <div className={`text-xl font-bold ${s.overtimeOccurred ? 'text-red-600' : 'text-emerald-700'}`}>
                          {s.overtimeOccurred ? `${s.overtimeCount}次` : '无'}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                        <Users className="w-3 h-3" />
                        审批节点（共 {s.approvalNodeCount} 个）
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.approvers.length > 0 ? (
                          s.approvers.map((a, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs border border-brand-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">无审批记录</span>
                        )}
                      </div>
                    </div>
                    {s.note && (
                      <p className="text-xs text-slate-600 bg-white/70 border border-slate-200 rounded-lg px-3 py-2.5 leading-relaxed">
                        <span className="font-semibold text-slate-800">总结：</span>{s.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                全流程复盘时间轴
              </h3>
              <span className="text-xs text-slate-400">{requestAuditLogs.length} 条记录 · {nodes.length} 个审批节点</span>
            </div>

            <div className="p-6 max-h-[800px] overflow-y-auto">
              {requestAuditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  暂无轨迹记录
                </div>
              ) : (
                <div className="space-y-1">
                  {requestAuditLogs.map((log, idx) => {
                    const actionConfig = AUDIT_ACTION_LABELS[log.action];
                    const isLast = idx === requestAuditLogs.length - 1;
                    const IconComp = AUDIT_ICONS[actionConfig.icon] || Activity;

                    const matchingReminder = (log.action === 'reminder_auto' || log.action === 'reminder_escalate' || log.action === 'reminder_acknowledge')
                      ? reminders.find((r) => r.requestId === log.requestId && Math.abs(r.triggeredAt - log.timestamp) < 1000)
                      : undefined;

                    return (
                      <div key={log.id} className="relative pl-8 pb-4">
                        {!isLast && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                          log.action === 'node_reject' || log.action === 'check_clearance_fail'
                            ? 'bg-red-100'
                            : log.action.includes('reminder') || log.action === 'mark_overtime'
                            ? 'bg-amber-100'
                            : log.action === 'complete_processing'
                            ? 'bg-emerald-100'
                            : 'bg-brand-50'
                        }`}>
                          <IconComp className={`w-3.5 h-3.5 ${actionConfig.color}`} />
                        </div>
                        <div className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-xs font-semibold ${actionConfig.color}`}>
                                {actionConfig.label}
                              </span>
                              {log.nodeName && (
                                <span className="ml-2 text-[10px] text-slate-400">
                                  节点{log.nodeOrder} · {log.nodeName}
                                </span>
                              )}
                              {(log.action === 'reminder_auto' || log.action === 'reminder_escalate') && matchingReminder && (
                                <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${REMINDER_HANDLER_TYPE_LABEL[matchingReminder.handlerType].bgColor} ${REMINDER_HANDLER_TYPE_LABEL[matchingReminder.handlerType].color}`}>
                                  {REMINDER_HANDLER_TYPE_LABEL[matchingReminder.handlerType].label}
                                </span>
                              )}
                              {log.action === 'reminder_acknowledge' && matchingReminder && matchingReminder.acknowledged && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-emerald-100 border-emerald-200 text-emerald-700">
                                  已签收
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mt-1">
                            {log.detail}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-400">
                              操作人：<span className="text-slate-500">{log.operatorName}</span>
                            </span>
                            {log.action === 'reminder_acknowledge' && matchingReminder && !matchingReminder.acknowledged && (
                              <button
                                onClick={() => acknowledgeReminder(matchingReminder.id)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
                              >
                                <UserCheck className="w-3 h-3" />
                                签收
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {requestQueueNumbers.some((q) => q.summary) && (
                    <>
                      {requestAuditLogs.length > 0 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-emerald-200" />
                      )}
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-emerald-50/40 p-4">
                          <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                            办结小结
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </h4>
                          {requestQueueNumbers.filter((q) => q.summary).map((q) => {
                            const s = q.summary!;
                            return (
                              <div key={q.id} className="mt-3 space-y-3">
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="rounded-lg bg-white border border-emerald-200 p-2.5">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                                      <Hourglass className="w-3 h-3" />
                                      等待时长
                                    </div>
                                    <div className="text-lg font-bold text-slate-800">{s.waitingDurationMinutes}<span className="text-xs font-normal text-slate-500 ml-0.5">分</span></div>
                                  </div>
                                  <div className="rounded-lg bg-white border border-emerald-200 p-2.5">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                                      <Activity className="w-3 h-3" />
                                      办理时长
                                    </div>
                                    <div className="text-lg font-bold text-emerald-700">{s.processingDurationMinutes}<span className="text-xs font-normal text-slate-500 ml-0.5">分</span></div>
                                  </div>
                                  <div className="rounded-lg bg-white border border-emerald-200 p-2.5">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                                      <Timer className="w-3 h-3" />
                                      总耗时
                                    </div>
                                    <div className="text-lg font-bold text-slate-800">{s.totalDurationMinutes}<span className="text-xs font-normal text-slate-500 ml-0.5">分</span></div>
                                  </div>
                                  <div className="rounded-lg bg-white border border-emerald-200 p-2.5">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
                                      {s.overtimeOccurred ? <AlertOctagon className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                      过号情况
                                    </div>
                                    <div className={`text-lg font-bold ${s.overtimeOccurred ? 'text-red-600' : 'text-emerald-700'}`}>
                                      {s.overtimeOccurred ? `${s.overtimeCount}次` : '无'}
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-lg bg-white border border-emerald-200 p-2.5">
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1.5">
                                    <Users className="w-3 h-3" />
                                    审批节点（共 {s.approvalNodeCount} 个）
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {s.approvers.length > 0 ? (
                                      s.approvers.map((a, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3" />
                                          {a}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-500">无审批记录</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOpinionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-4 ${
              showOpinionModal === 'approve' ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'
            }`}>
              <h3 className={`font-bold text-lg ${
                showOpinionModal === 'approve' ? 'text-emerald-900' : 'text-red-900'
              }`}>
                {showOpinionModal === 'approve' ? '通过审批' : '驳回申请'}
              </h3>
              <p className={`text-sm mt-1 ${
                showOpinionModal === 'approve' ? 'text-emerald-700' : 'text-red-700'
              }`}>
                节点：{activeNode?.nodeName} · 审批人：{activeNode?.approverName}
              </p>
            </div>
            <div className="p-6">
              <label className="label">
                {showOpinionModal === 'approve' ? '审批意见' : '驳回理由'} <span className="text-red-500">*</span>
              </label>
              <textarea
                className="textarea"
                rows={4}
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                placeholder={
                  showOpinionModal === 'approve'
                    ? '请填写审批意见（如：材料齐全，同意调阅，请按规定办理...）'
                    : '请详细说明驳回理由，以便申请人修改或补充材料...'
                }
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOpinionModal(null);
                  setOpinion('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={showOpinionModal === 'approve' ? handleApprove : handleReject}
                disabled={!opinion.trim()}
                className={showOpinionModal === 'approve' ? 'btn-success' : 'btn-danger'}
              >
                <Send className="w-4 h-4" />
                确认{showOpinionModal === 'approve' ? '通过' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
