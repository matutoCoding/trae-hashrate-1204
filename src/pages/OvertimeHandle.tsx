import { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Ban,
  Users,
  FileText,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  User,
  ArrowLeftRight,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { QUEUE_STATUS_MAP } from '@/types';
import { formatTime, formatRelativeTime } from '@/utils';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'requeued' | 'invalid';

export default function OvertimeHandle() {
  const navigate = useNavigate();
  const { overtimeRecords, queueNumbers, requeueNumber, currentUserId } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [requeueResult, setRequeueResult] = useState<string | null>(null);

  const currentUser = useAppStore((s) => {
    // 简单的方式，用 id 获取名字
    const u = s.archiveRequests.find((r) => true);
    return u ? '周管理' : '管理员';
  });

  const records = overtimeRecords
    .filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !r.numberCode.toLowerCase().includes(s) &&
          !r.userName.toLowerCase().includes(s) &&
          !r.remark.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // 统计
  const totalOvertime = overtimeRecords.length;
  const requeuedCount = overtimeRecords.filter((r) => r.status === 'requeued').length;
  const invalidCount = overtimeRecords.filter((r) => r.status === 'invalid').length;
  const passedQueues = queueNumbers.filter((q) => q.status === 'passed');

  // 获取当前过号待处理的
  const pendingPassed = queueNumbers.filter((q) => q.status === 'passed');

  const stats = [
    { label: '总过号记录', value: totalOvertime, icon: AlertTriangle, color: 'from-orange-500 to-red-500' },
    { label: '重排队尾', value: requeuedCount, icon: RotateCcw, color: 'from-blue-500 to-blue-600' },
    { label: '已作废', value: invalidCount, icon: Ban, color: 'from-rose-500 to-red-700' },
    { label: '待处理', value: pendingPassed.length, icon: Clock, color: 'from-amber-500 to-orange-600' },
  ];

  const handleRequeue = (queueId: string) => {
    const queue = queueNumbers.find((q) => q.id === queueId);
    if (!queue) return;
    requeueNumber(queueId, currentUser);
    setRequeueResult(`号码 ${queue.numberCode} 已成功重排队尾`);
    setTimeout(() => setRequeueResult(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-orange-500" />
          过号处理中心
        </h1>
        <p className="text-sm text-slate-500 mt-1">处理叫号未到场的过号记录，执行重排或作废操作</p>
      </div>

      {/* 成功提示 */}
      {requeueResult && (
        <div className="card border-emerald-200 bg-emerald-50/50">
          <div className="p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{requeueResult}</span>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between">
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

      {/* 过号规则说明 */}
      <div className="card border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">过号处理规则</h3>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    level: 1,
                    title: '首次过号',
                    action: '重排队尾',
                    desc: '号码移至队尾，下次叫号',
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    border: 'border-l-blue-400',
                  },
                  {
                    level: 2,
                    title: '二次过号',
                    action: '重排队尾 + 警告',
                    desc: '再次重排，提示最后警告',
                    color: 'bg-orange-100 text-orange-700 border-orange-200',
                    border: 'border-l-orange-400',
                  },
                  {
                    level: 3,
                    title: '三次过号',
                    action: '自动作废',
                    desc: '号码作废，需重新取号',
                    color: 'bg-red-100 text-red-700 border-red-200',
                    border: 'border-l-red-400',
                  },
                ].map((r) => (
                  <div key={r.level} className={`p-4 rounded-xl border-2 ${r.color} border-l-4 ${r.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">第{r.level}次</span>
                      <Zap className={`w-4 h-4 ${r.level === 3 ? 'text-red-500' : r.level === 2 ? 'text-orange-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="font-bold text-base mb-1">{r.title}</div>
                    <div className="text-xs font-semibold mb-1 opacity-90">处理：{r.action}</div>
                    <div className="text-[11px] opacity-80">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：过号记录列表 */}
        <div className="xl:col-span-2 space-y-5">
          {/* 筛选栏 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="card p-1.5 inline-flex gap-1">
              {[
                { key: 'all' as FilterType, label: '全部记录', count: totalOvertime },
                { key: 'requeued' as FilterType, label: '重排队尾', count: requeuedCount },
                { key: 'invalid' as FilterType, label: '已作废', count: invalidCount },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f.key
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input pl-10 py-2 text-sm"
                placeholder="搜索号码、姓名..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 过号记录表格 */}
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>号码</th>
                    <th>用户</th>
                    <th>过号次数</th>
                    <th>处理结果</th>
                    <th>备注</th>
                    <th>处理人</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>暂无过号记录</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="font-mono font-bold text-lg text-slate-900">{r.numberCode}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                              {r.userName.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800">{r.userName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  idx < r.count
                                    ? r.count >= 3
                                      ? 'bg-red-500 text-white'
                                      : r.count === 2
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {idx + 1}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          {r.status === 'requeued' ? (
                            <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              已重排
                            </span>
                          ) : (
                            <span className="badge bg-red-50 text-red-700 border border-red-200">
                              <Ban className="w-3 h-3 mr-1" />
                              已作废
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-slate-600 max-w-[200px] truncate" title={r.remark}>
                          {r.remark}
                        </td>
                        <td className="text-sm text-slate-600">
                          {r.handledBy || <span className="text-slate-400">系统自动</span>}
                        </td>
                        <td>
                          <div className="text-sm text-slate-700">{formatTime(r.createdAt)}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(r.createdAt)}</div>
                        </td>
                        <td>
                          {r.status === 'invalid' ? (
                            <span className="text-xs text-slate-400">已作废</span>
                          ) : (
                            <button
                              className="text-sm text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
                              onClick={() => navigate(`/approval?search=${r.numberCode}`)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              关联申请
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右侧：待处理 + 用户统计 */}
        <div className="space-y-6">
          {/* 用户过号次数排行 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                过号用户统计
              </h3>
            </div>
            <div className="p-4">
              {(() => {
                const userMap: Record<string, { name: string; count: number; invalid: number }> = {};
                overtimeRecords.forEach((r) => {
                  const key = r.userName;
                  if (!userMap[key]) {
                    userMap[key] = { name: key, count: 0, invalid: 0 };
                  }
                  userMap[key].count += 1;
                  if (r.status === 'invalid') userMap[key].invalid += 1;
                });
                const list = Object.values(userMap).sort((a, b) => b.count - a.count);
                if (list.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      暂无统计数据
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {list.slice(0, 6).map((u, idx) => (
                      <div key={u.name} className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          idx === 0
                            ? 'bg-red-500 text-white'
                            : idx === 1
                            ? 'bg-orange-500 text-white'
                            : idx === 2
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-800 text-sm">{u.name}</span>
                            <span className="text-sm font-bold text-slate-700">{u.count}次</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${u.count >= 3 ? 'bg-red-500' : u.count === 2 ? 'bg-orange-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, u.count * 33)}%` }}
                            />
                          </div>
                          {u.invalid > 0 && (
                            <div className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              作废{u.invalid}个号码
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 连续过号监控 */}
          <div className="card border-red-200 bg-red-50/30">
            <div className="card-header border-red-100">
              <h3 className="font-semibold text-red-900 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                连续过号高风险
              </h3>
              <span className="badge bg-red-100 text-red-700">重点监控</span>
            </div>
            <div className="p-4">
              {(() => {
                const riskUsers = queueNumbers
                  .filter((q) => q.overtimeCount >= 2 && q.status !== 'invalid')
                  .sort((a, b) => b.overtimeCount - a.overtimeCount);
                if (riskUsers.length === 0) {
                  return (
                    <div className="py-6 text-center text-red-400 text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      当前无高风险用户
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {riskUsers.map((q) => (
                      <div key={q.id} className="p-3 rounded-xl bg-white border border-red-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{q.numberCode}</span>
                              <span className={`badge ${QUEUE_STATUS_MAP[q.status].bgColor} ${QUEUE_STATUS_MAP[q.status].color}`}>
                                {QUEUE_STATUS_MAP[q.status].label}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {q.userName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-red-500 mb-1">过号次数</div>
                            <div className="font-black text-xl text-red-600">{q.overtimeCount}/3</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 flex-1 rounded-full ${idx < q.overtimeCount ? 'bg-red-500' : 'bg-red-100'}`}
                            />
                          ))}
                        </div>
                        {q.overtimeCount >= 2 && (
                          <p className="mt-2 text-[11px] text-red-600 bg-red-50 rounded-lg p-2 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            再次过号将自动作废，需重新取号排队
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 操作说明 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-brand-500" />
                处理流程
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {[
                  { step: 1, title: '叫号未到场', desc: '管理员判定过号，系统记录次数' },
                  { step: 2, title: '判断过号次数', desc: '系统根据累计次数决定处理方式' },
                  { step: 3, title: '重排队尾/作废', desc: '<3次重排，≥3次自动作废' },
                  { step: 4, title: '同步记录', desc: '记录责任人、时间、处理结果' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                      {s.step}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{s.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
