import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Hourglass,
  Activity,
  AlertOctagon,
  TrendingUp,
  BarChart3,
  FileText,
  Shield,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { SECRECY_LEVEL_MAP, type SecrecyLevel } from '@/types';
import { formatTime, formatRelativeTime } from '@/utils';

export default function CompletionReview() {
  const navigate = useNavigate();
  const { queueNumbers, archiveRequests, approvalNodes } = useAppStore();

  const completed = useMemo(
    () => queueNumbers.filter((q) => q.status === 'completed' && q.summary),
    [queueNumbers]
  );

  const stats = useMemo(() => {
    if (completed.length === 0) return { avgWait: 0, avgProcess: 0, avgTotal: 0, overtimeCount: 0, overtimeRate: 0 };
    const totalWait = completed.reduce((s, q) => s + (q.summary?.waitingDurationMinutes || 0), 0);
    const totalProcess = completed.reduce((s, q) => s + (q.summary?.processingDurationMinutes || 0), 0);
    const totalAll = completed.reduce((s, q) => s + (q.summary?.totalDurationMinutes || 0), 0);
    const ot = completed.filter((q) => q.summary?.overtimeOccurred).length;
    return {
      avgWait: Math.round(totalWait / completed.length),
      avgProcess: Math.round(totalProcess / completed.length),
      avgTotal: Math.round(totalAll / completed.length),
      overtimeCount: ot,
      overtimeRate: Math.round((ot / completed.length) * 100),
    };
  }, [completed]);

  const byWindow = useMemo(() => {
    const map = new Map<number, { windowNo: number; count: number; avgWait: number; avgProcess: number; avgTotal: number; overtimeCount: number }>();
    completed.forEach((q) => {
      const w = q.windowNo || 0;
      if (!map.has(w)) map.set(w, { windowNo: w, count: 0, avgWait: 0, avgProcess: 0, avgTotal: 0, overtimeCount: 0 });
      const g = map.get(w)!;
      g.count++;
      g.avgWait += q.summary?.waitingDurationMinutes || 0;
      g.avgProcess += q.summary?.processingDurationMinutes || 0;
      g.avgTotal += q.summary?.totalDurationMinutes || 0;
      if (q.summary?.overtimeOccurred) g.overtimeCount++;
    });
    return Array.from(map.values()).map((g) => ({
      ...g,
      avgWait: Math.round(g.avgWait / g.count),
      avgProcess: Math.round(g.avgProcess / g.count),
      avgTotal: Math.round(g.avgTotal / g.count),
    })).sort((a, b) => a.windowNo - b.windowNo);
  }, [completed]);

  const trend = useMemo(() => {
    const sorted = [...completed].sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
    const maxTotal = Math.max(...sorted.map((q) => q.summary?.totalDurationMinutes || 0), 1);
    return sorted.map((q) => ({
      ...q,
      barHeight: Math.max(4, Math.round(((q.summary?.totalDurationMinutes || 0) / maxTotal) * 100)),
    }));
  }, [completed]);

  const anomalies = useMemo(
    () =>
      completed
        .filter((q) => (q.summary?.totalDurationMinutes || 0) > stats.avgTotal * 1.5 + 10)
        .sort((a, b) => (b.summary?.totalDurationMinutes || 0) - (a.summary?.totalDurationMinutes || 0)),
    [completed, stats]
  );

  const bySecrecy = useMemo(() => {
    const map = new Map<SecrecyLevel, { label: string; count: number; avgTotal: number }>();
    completed.forEach((q) => {
      const req = archiveRequests.find((r) => r.id === q.requestId);
      if (!req) return;
      const sl = req.secrecyLevel;
      if (!map.has(sl)) map.set(sl, { label: SECRECY_LEVEL_MAP[sl].label, count: 0, avgTotal: 0 });
      const g = map.get(sl)!;
      g.count++;
      g.avgTotal += q.summary?.totalDurationMinutes || 0;
    });
    return Array.from(map.values()).map((g) => ({ ...g, avgTotal: Math.round(g.avgTotal / g.count) }));
  }, [completed, archiveRequests]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">办结复盘</h1>
          <p className="text-sm text-slate-500 mt-1">调卷办结数据汇总、耗时趋势与异常复盘</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/approval')} className="btn-secondary">
            <FileText className="w-4 h-4" />
            审批列表
          </button>
          <button onClick={() => navigate('/queue/manage')} className="btn-secondary">
            <BarChart3 className="w-4 h-4" />
            叫号管理
          </button>
        </div>
      </div>

      {completed.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">暂无办结数据，完成办理后自动统计</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="stat-card">
              <div className="stat-icon bg-blue-500">
                <FileText className="w-5 h-5" />
              </div>
              <div className="stat-value text-blue-700">{completed.length}</div>
              <div className="stat-label">办结总量</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-amber-500">
                <Hourglass className="w-5 h-5" />
              </div>
              <div className="stat-value text-amber-700">{stats.avgWait}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
              <div className="stat-label">平均等待</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-emerald-500">
                <Activity className="w-5 h-5" />
              </div>
              <div className="stat-value text-emerald-700">{stats.avgProcess}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
              <div className="stat-label">平均办理</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-slate-600">
                <Clock className="w-5 h-5" />
              </div>
              <div className="stat-value text-slate-800">{stats.avgTotal}<span className="text-sm font-normal text-slate-500 ml-0.5">分</span></div>
              <div className="stat-label">平均总耗时</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-red-500">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="stat-value text-red-700">{stats.overtimeRate}<span className="text-sm font-normal text-slate-500 ml-0.5">%</span></div>
              <div className="stat-label">过号率（{stats.overtimeCount}次）</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                  办结耗时趋势
                </h3>
                <span className="text-xs text-slate-400">每条柱=一个办结，高度=总耗时</span>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-1 h-40 border-b border-slate-200 pb-1">
                  {trend.map((q) => (
                    <div
                      key={q.id}
                      className="flex-1 min-w-[6px] rounded-t transition-all hover:opacity-80 cursor-pointer group relative"
                      style={{
                        height: q.barHeight + '%',
                        background: (q.summary?.totalDurationMinutes || 0) > stats.avgTotal * 1.5
                          ? 'linear-gradient(to top, #f97316, #ef4444)'
                          : 'linear-gradient(to top, #6366f1, #818cf8)',
                      }}
                      onClick={() => navigate(`/approval/${q.requestId}`)}
                      title={q.numberCode + ' 总耗时' + (q.summary?.totalDurationMinutes || 0) + '分'}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {q.numberCode} {q.summary?.totalDurationMinutes}分
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-brand-400" />正常</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-gradient-to-r from-orange-500 to-red-500" />异常（&gt;均值1.5倍）</span>
                  <span className="ml-auto">均值线：{stats.avgTotal}分钟</span>
                </div>
                <div className="relative mt-1 border-t border-dashed border-red-300" style={{ top: `-${Math.round((stats.avgTotal / Math.max(...trend.map(t => t.summary?.totalDurationMinutes || 1))) * 100)}%` }} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-500" />
                    按密级统计
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {bySecrecy.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{s.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{s.count}件</span>
                        <span className="text-sm font-bold text-slate-800">均{s.avgTotal}分</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-500" />
                    按窗口统计
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {byWindow.map((w) => (
                    <div key={w.windowNo} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{w.windowNo}号窗口</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{w.count}件</span>
                        <span className="text-xs text-slate-500">等{w.avgWait}分</span>
                        <span className="text-xs text-slate-500">办{w.avgProcess}分</span>
                        {w.overtimeCount > 0 && <span className="text-xs text-red-500">过号{w.overtimeCount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="card border-orange-200">
              <div className="card-header border-orange-100">
                <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  异常耗时单子
                  <span className="badge bg-orange-100 text-orange-700">{anomalies.length}</span>
                </h3>
                <span className="text-xs text-orange-500">总耗时超过均值1.5倍+10分钟</span>
              </div>
              <div className="divide-y divide-orange-100">
                {anomalies.map((q) => {
                  const req = archiveRequests.find((r) => r.id === q.requestId);
                  return (
                    <div
                      key={q.id}
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-orange-50/50 transition-all"
                      onClick={() => navigate(`/approval/${q.requestId}`)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow">
                        <span className="font-mono font-bold text-white text-sm">{q.numberCode}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{req?.title || '未知申请'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {q.windowNo}号窗口 · 完成于 {q.completedAt && formatRelativeTime(q.completedAt)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-red-600">{q.summary?.totalDurationMinutes}<span className="text-xs font-normal text-slate-500 ml-0.5">分</span></div>
                        <div className="text-[10px] text-slate-500">等{q.summary?.waitingDurationMinutes}分 · 办{q.summary?.processingDurationMinutes}分</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-500" />
                办结明细
              </h3>
              <span className="text-xs text-slate-400">按完成时间倒序</span>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>号码</th>
                    <th>申请</th>
                    <th>密级</th>
                    <th>窗口</th>
                    <th>等待</th>
                    <th>办理</th>
                    <th>总耗时</th>
                    <th>过号</th>
                    <th>审批节点</th>
                    <th>完成时间</th>
                  </tr>
                </thead>
                <tbody>
                  {[...completed].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).map((q) => {
                    const req = archiveRequests.find((r) => r.id === q.requestId);
                    const isAnomaly = (q.summary?.totalDurationMinutes || 0) > stats.avgTotal * 1.5 + 10;
                    return (
                      <tr
                        key={q.id}
                        className={`cursor-pointer ${isAnomaly ? 'bg-orange-50/50' : ''}`}
                        onClick={() => navigate(`/approval/${q.requestId}`)}
                      >
                        <td><span className="font-mono font-bold text-brand-600">{q.numberCode}</span></td>
                        <td><span className="text-sm text-slate-900 truncate max-w-[200px] block">{req?.title || '—'}</span></td>
                        <td>
                          {req && (
                            <span className={`badge text-[10px] border ${SECRECY_LEVEL_MAP[req.secrecyLevel].bgColor} ${SECRECY_LEVEL_MAP[req.secrecyLevel].color}`}>
                              {SECRECY_LEVEL_MAP[req.secrecyLevel].label}
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-slate-700">{q.windowNo}号</td>
                        <td className="text-sm">{q.summary?.waitingDurationMinutes}分</td>
                        <td className="text-sm">{q.summary?.processingDurationMinutes}分</td>
                        <td>
                          <span className={`text-sm font-bold ${isAnomaly ? 'text-red-600' : 'text-slate-800'}`}>
                            {q.summary?.totalDurationMinutes}分
                          </span>
                        </td>
                        <td>
                          {q.summary?.overtimeOccurred
                            ? <span className="text-xs text-red-600 font-medium">{q.summary.overtimeCount}次</span>
                            : <span className="text-xs text-slate-400">无</span>}
                        </td>
                        <td className="text-xs text-slate-600">{q.summary?.approvalNodeCount}个 / {q.summary?.approvers.length}人签批</td>
                        <td className="text-xs text-slate-500">{q.completedAt && formatTime(q.completedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
