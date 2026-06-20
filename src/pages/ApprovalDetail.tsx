import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Shield,
  User,
  Building,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  ChevronRight,
  Ticket,
  Hourglass,
  Eye,
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
} from 'lucide-react';
import { useAppStore } from '@/store';
import { REQUEST_STATUS_MAP, NODE_STATUS_MAP, SECRECY_LEVEL_MAP, AUDIT_ACTION_LABELS, type NodeStatus, type AuditAction } from '@/types';
import { formatTime, formatRelativeTime, formatCountdown } from '@/utils';

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
  const { archiveRequests, approvalNodes, reminderLogs, auditLogs, queueNumbers, approveNode, rejectNode, triggerEscalation, takeNumber, currentUserId } = useAppStore();
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

  const isNodeActive = (node: typeof nodes[0]) => {
    return node.nodeOrder === req.currentNode && (node.status === 'active' || node.status === 'timeout' || node.status === 'escalated');
  };

  const isNodeWaiting = (node: typeof nodes[0]) => {
    return node.nodeOrder > req.currentNode && node.status === 'pending';
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
                <Clock className="w-4 h-4 text-brand-500" />
                审批流程轨迹
              </h3>
              <span className="text-xs text-slate-400">共 {nodes.length} 个审批节点</span>
            </div>

            <div className="p-6">
              <div className="relative">
                {nodes.map((node, idx) => {
                  const isActive = isNodeActive(node);
                  const isWaiting = isNodeWaiting(node);
                  const cd = node.deadline ? formatCountdown(node.deadline) : null;

                  return (
                    <div key={node.id} className="relative pb-8 last:pb-0">
                      {idx < nodes.length - 1 && (
                        <div className={`absolute left-[19px] top-12 bottom-0 w-0.5 ${
                          node.status === 'approved' ? 'bg-emerald-300' : 'bg-slate-200'
                        }`} />
                      )}

                      <div className={`relative flex gap-5 ${isActive ? 'animate-pulse-slow' : ''}`}>
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                            node.status === 'approved'
                              ? 'bg-emerald-500'
                              : node.status === 'rejected'
                              ? 'bg-red-500'
                              : node.status === 'timeout' || node.status === 'escalated'
                              ? 'bg-orange-500 animate-blink'
                              : isActive
                              ? 'bg-brand-500 ring-4 ring-brand-100'
                              : isWaiting
                              ? 'bg-slate-200'
                              : 'bg-slate-300'
                          }`}>
                            {node.status === 'approved' ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : node.status === 'rejected' ? (
                              <XCircle className="w-5 h-5 text-white" />
                            ) : node.status === 'timeout' || node.status === 'escalated' ? (
                              <Hourglass className="w-5 h-5 text-white" />
                            ) : isActive ? (
                              <Eye className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-slate-400 text-sm font-bold">{node.nodeOrder}</span>
                            )}
                          </div>
                        </div>

                        <div className={`flex-1 rounded-xl border p-5 transition-all ${
                          isActive
                            ? 'border-brand-200 bg-brand-50/50 shadow-md'
                            : node.status === 'rejected'
                            ? 'border-red-200 bg-red-50/50'
                            : node.status === 'timeout' || node.status === 'escalated'
                            ? 'border-orange-200 bg-orange-50/50'
                            : isWaiting
                            ? 'border-slate-100 bg-slate-50/50'
                            : 'border-slate-200 bg-white'
                        }`}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900">
                                  节点 {node.nodeOrder}：{node.nodeName}
                                </h4>
                                {isWaiting ? (
                                  <span className="badge bg-slate-100 text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-300" />
                                    等待前一节点完成
                                  </span>
                                ) : (
                                  <span className={`badge ${
                                    node.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : node.status === 'rejected'
                                      ? 'bg-red-50 text-red-700'
                                      : node.status === 'escalated'
                                      ? 'bg-red-50 text-red-700'
                                      : node.status === 'timeout'
                                      ? 'bg-orange-50 text-orange-700'
                                      : node.status === 'active'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${NODE_STATUS_MAP[node.status].dotColor} ${isActive ? 'animate-pulse' : ''}`} />
                                    {node.status === 'active' ? '处理中' : NODE_STATUS_MAP[node.status].label}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-medium text-slate-700">{node.approverName}</span>
                                <span>·</span>
                                <span>{node.approverTitle}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {isWaiting ? (
                                <div className="text-sm text-slate-400">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  尚未开始计时
                                </div>
                              ) : isActive && cd ? (
                                <div>
                                  <div className={`font-mono text-lg font-bold ${
                                    cd.isOverdue
                                      ? 'text-red-600 animate-blink'
                                      : cd.isWarning
                                      ? 'text-amber-600'
                                      : 'text-brand-600'
                                  }`}>
                                    {cd.isOverdue ? '已超时' : cd.text}
                                  </div>
                                  {(cd.isOverdue || cd.isWarning) && isCurrentApprover && (
                                    <button
                                      onClick={() => triggerEscalation(node.id)}
                                      className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 ml-auto"
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      申请升级催办
                                    </button>
                                  )}
                                </div>
                              ) : node.handledAt ? (
                                <div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {formatTime(node.handledAt)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {formatRelativeTime(node.handledAt)}处理
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100/80">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400">开始时间</span>
                                <div className="font-medium text-slate-700 mt-0.5">
                                  {node.startedAt ? formatTime(node.startedAt) : '-'}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">截止时间</span>
                                <div className="font-medium text-slate-700 mt-0.5">
                                  {node.deadline ? formatTime(node.deadline) : '-'}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">处理时间</span>
                                <div className="font-medium text-slate-700 mt-0.5">
                                  {node.handledAt ? formatTime(node.handledAt) : '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {node.opinion && (
                            <div className="mt-4 p-3.5 rounded-lg bg-white/80 border border-slate-100">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="text-[11px] font-medium text-slate-500 mb-1">
                                    {node.status === 'approved' ? '审批意见' : '驳回理由'}
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed">{node.opinion}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {isActive && cd && (node.status === 'active' || node.status === 'timeout') && (
                            <div className="mt-4">
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    cd.isOverdue
                                      ? 'bg-red-500'
                                      : cd.isWarning
                                      ? 'bg-amber-500'
                                      : 'bg-brand-500'
                                  }`}
                                  style={{
                                    width: cd.isOverdue
                                      ? '100%'
                                      : `${Math.max(5, 100 - ((node.deadline! - Date.now()) / (node.timeoutMinutes * 60 * 1000)) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="relative flex gap-5">
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                      req.status === 'approved' || req.status === 'queuing' || req.status === 'completed'
                        ? 'bg-emerald-500'
                        : req.status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-slate-300'
                    }`}>
                      {req.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 rounded-xl border p-5 ${
                    req.status === 'rejected'
                      ? 'border-red-200 bg-red-50/50'
                      : req.status === 'approved' || req.status === 'queuing' || req.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      流程终点
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                      <span className={`badge ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </h4>
                    <div className="text-sm text-slate-600 mt-2">
                      {req.status === 'rejected' && (
                        <>
                          <p className="text-red-700 mb-2">申请被驳回，原因如下：</p>
                          <p className="bg-white/80 p-3 rounded-lg border border-red-100">
                            {req.rejectionReason || '未填写驳回理由'}
                          </p>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <p>审批全部通过，<Link to="/queue/take" className="text-brand-600 font-medium hover:underline">前往取号排队 →</Link></p>
                      )}
                      {req.status === 'queuing' && (
                        <p>已加入等待队列，<Link to="/queue" className="text-brand-600 font-medium hover:underline">查看叫号大屏 →</Link></p>
                      )}
                      {req.status === 'completed' && (
                        <p>调卷业务已办理完成</p>
                      )}
                      {(req.status === 'approving' || req.status === 'checking') && (
                        <p className="text-slate-500">请等待后续节点审批完成</p>
                      )}
                      {req.approvedAt && (
                        <p className="text-xs text-slate-500 mt-2">
                          完成时间：{formatTime(req.approvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-500" />
                完整轨迹日志
              </h3>
              <span className="text-xs text-slate-400">共 {requestAuditLogs.length} 条记录</span>
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto">
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
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mt-1">
                            {log.detail}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1.5">
                            操作人：<span className="text-slate-500">{log.operatorName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
