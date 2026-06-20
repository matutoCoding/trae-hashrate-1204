import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  FileText,
  ArrowLeft,
  QrCode,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { mockUsers } from '@/data/mockData';
import { REQUEST_STATUS_MAP, SECRECY_LEVEL_MAP } from '@/types';
import { formatTime } from '@/utils';

export default function TakeNumber() {
  const navigate = useNavigate();
  const { archiveRequests, takeNumber, queueNumbers, currentUserId } = useAppStore();
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    numberCode?: string;
    position?: number;
    estimatedMinutes?: number;
  } | null>(null);
  const [search, setSearch] = useState('');

  const selectedUser = mockUsers.find((u) => u.id === selectedUserId) || mockUsers[0];

  // 筛选审批通过、未取号的申请
  const availableRequests = archiveRequests.filter((r) => {
    if (r.userId !== selectedUserId) return false;
    if (r.status !== 'approved' && r.status !== 'queuing') return false;
    const hasActiveQueue = queueNumbers.some(
      (q) => q.requestId === r.id && (q.status === 'waiting' || q.status === 'calling' || q.status === 'processing')
    );
    if (hasActiveQueue) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !r.title.toLowerCase().includes(s) &&
        !r.archiveNo.toLowerCase().includes(s) &&
        !r.archiveName.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const waitingCount = queueNumbers.filter((q) => q.status === 'waiting').length;

  const handleTakeNumber = () => {
    if (!selectedRequestId) return;
    const res = takeNumber(selectedRequestId, selectedUser.id, selectedUser.name);
    const newPosition = waitingCount + 1;
    setResult({
      success: res.success,
      message: res.message,
      numberCode: res.numberCode,
      position: res.success ? newPosition : undefined,
      estimatedMinutes: res.success ? newPosition * 8 : undefined,
    });

    if (res.success) {
      setTimeout(() => {
        navigate('/queue');
      }, 3000);
    }
  };

  // 如果有可直接取号的，默认选中第一个
  useEffect(() => {
    if (availableRequests.length > 0 && !selectedRequestId) {
      setSelectedRequestId(availableRequests[0].id);
    }
    if (availableRequests.length === 0) {
      setSelectedRequestId('');
    }
  }, [availableRequests.length, selectedUserId]);

  const selectedRequest = archiveRequests.find((r) => r.id === selectedRequestId);

  return (
    <div className="min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* 顶部 */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary py-2 px-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-brand-500" />
              取号排队
            </h1>
            <p className="text-sm text-slate-500 mt-1">审批通过的调卷申请可在此取号，按顺序办理</p>
          </div>
        </div>

        {/* 成功结果展示 */}
        {result?.success && result.numberCode ? (
          <div className="card overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-8 text-white text-center relative overflow-hidden">
              {/* 装饰 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  取号成功
                </div>
                <div className="text-sm opacity-80 mb-2">您的排队号码</div>
                <div className="font-mono text-8xl font-black tracking-widest my-4 animate-pulse-slow">
                  {result.numberCode}
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="text-xs opacity-75 mb-1">队列位置</div>
                    <div className="text-3xl font-bold">第{result.position}位</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="text-xs opacity-75 mb-1">预计等待</div>
                    <div className="text-3xl font-bold">{result.estimatedMinutes}分</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="text-xs opacity-75 mb-1">取号时间</div>
                    <div className="text-lg font-bold">
                      {formatTime(Date.now()).split(' ')[1]}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 票据底部 */}
            <div className="relative">
              <div className="absolute -top-3 left-0 w-full flex justify-between px-0">
                <div className="w-6 h-6 rounded-full bg-slate-50" />
                <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2 my-2" />
                <div className="w-6 h-6 rounded-full bg-slate-50" />
              </div>
            </div>
            <div className="p-6 pt-8">
              {selectedRequest && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      调卷事由
                    </span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{selectedRequest.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      档案信息
                    </span>
                    <span className="font-mono text-slate-800">{selectedRequest.archiveNo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      办理人
                    </span>
                    <span className="font-medium text-slate-800">{selectedRequest.userName}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-12 h-12 text-slate-400" />
                  <div className="text-xs text-slate-500">
                    <div>扫描二维码查看排队进度</div>
                    <div className="text-slate-400 mt-0.5">或查看叫号大屏等待叫号</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/queue')}
                  className="btn-primary"
                >
                  查看叫号大屏
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  叫号未到场将判定过号
                </span>
                <span>连续3次过号号码作废</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 队列概览 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">当前等待</div>
                    <div className="text-2xl font-bold text-slate-900">{waitingCount}人</div>
                  </div>
                </div>
              </div>
              <div className="stat-card hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">预计等待</div>
                    <div className="text-2xl font-bold text-slate-900">{waitingCount * 8}分</div>
                  </div>
                </div>
              </div>
              <div className="stat-card hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">可办理</div>
                    <div className="text-2xl font-bold text-slate-900">{availableRequests.length}件</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 选择用户 */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" />
                  选择办理人
                </h3>
              </div>
              <div className="p-5">
                <select
                  className="select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  {mockUsers.filter((u) => u.role === 'requester' || u.role === 'admin').map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.department}（{u.title}）
                    </option>
                  ))}
                </select>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    权限等级：
                    <span className={`badge border ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].bgColor} ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].color}`}>
                      {SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].label}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* 可办理的调卷申请 */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-500" />
                  选择调卷申请
                </h3>
                {availableRequests.length > 0 && (
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="input pl-10 py-2 text-sm"
                      placeholder="搜索..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="p-4">
                {availableRequests.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">暂无审批通过的调卷申请</p>
                    <p className="text-slate-400 text-sm mt-1">请先发起调卷申请并完成审批</p>
                    <button
                      onClick={() => navigate('/approval/new')}
                      className="btn-primary mt-4"
                    >
                      <FileText className="w-4 h-4" />
                      发起调卷申请
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableRequests.map((req) => {
                      const secrecy = SECRECY_LEVEL_MAP[req.secrecyLevel];
                      const isSelected = selectedRequestId === req.id;
                      return (
                        <label
                          key={req.id}
                          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/50 shadow-md'
                              : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="request"
                              checked={isSelected}
                              onChange={() => setSelectedRequestId(req.id)}
                              className="mt-1.5 w-4 h-4 text-brand-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 truncate">{req.title}</span>
                                <span className={`badge border ${secrecy.bgColor} ${secrecy.color}`}>
                                  <Shield className="w-3 h-3 mr-1" />
                                  {secrecy.label}
                                </span>
                                <span className={`badge ${REQUEST_STATUS_MAP[req.status].bgColor} ${REQUEST_STATUS_MAP[req.status].color}`}>
                                  {REQUEST_STATUS_MAP[req.status].label}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-500">
                                <span>档案编号：<span className="font-mono text-slate-700">{req.archiveNo}</span></span>
                                <span>借阅期限：<span className="text-slate-700">{req.borrowPeriod}</span></span>
                                <span>审批完成：<span className="text-slate-700">{req.approvedAt ? formatTime(req.approvedAt) : '-'}</span></span>
                              </div>
                              <p className="mt-2 text-xs text-slate-600 line-clamp-1">
                                {req.archiveName}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {availableRequests.length > 0 && (
                <div className="px-5 pb-5">
                  {/* 错误提示 */}
                  {result && !result.success && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      {result.message}
                    </div>
                  )}

                  <button
                    onClick={handleTakeNumber}
                    disabled={!selectedRequestId}
                    className="w-full btn-primary py-4 text-base shadow-lg"
                  >
                    <Ticket className="w-5 h-5" />
                    确认取号排队
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      取号后请留意叫号
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      叫号未到场将判定过号
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
