import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FileText,
  ChevronRight,
  Shield,
  User,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { REQUEST_STATUS_MAP, SECRECY_LEVEL_MAP, type RequestStatus } from '@/types';
import { formatTime, formatRelativeTime, REQUEST_STATUS_FILTERS } from '@/utils';

export default function ApprovalList() {
  const navigate = useNavigate();
  const { archiveRequests } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'completed'>('created');
  const [completedRange, setCompletedRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const rangeStart = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sortBy !== 'completed' || completedRange === 'all') return 0;
    if (completedRange === 'today') return today.getTime();
    if (completedRange === 'week') return today.getTime() - 7 * 24 * 60 * 60 * 1000;
    return today.getTime() - 30 * 24 * 60 * 60 * 1000;
  })();

  const filtered = archiveRequests.filter((r) => {
    if (sortBy === 'completed' && r.status !== 'completed') return false;
    if (sortBy === 'completed' && rangeStart > 0 && (!r.completedAt || r.completedAt < rangeStart)) return false;
    if (sortBy !== 'completed' && statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !r.title.toLowerCase().includes(s) &&
        !r.archiveNo.toLowerCase().includes(s) &&
        !r.archiveName.toLowerCase().includes(s) &&
        !r.userName.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'completed') {
      const ac = a.completedAt || 0;
      const bc = b.completedAt || 0;
      return bc - ac;
    }
    return b.createdAt - a.createdAt;
  });

  const counts = REQUEST_STATUS_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? archiveRequests.length : archiveRequests.filter((r) => r.status === f.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">调卷审批</h1>
          <p className="text-sm text-slate-500 mt-1">管理所有档案调卷申请的审批流程</p>
        </div>
        <button onClick={() => navigate('/approval/new')} className="btn-primary">
          <Plus className="w-4 h-4" />
          发起调卷申请
        </button>
      </div>

      {/* 筛选标签 */}
      {sortBy !== 'completed' && (
        <div className="card p-1.5 inline-flex flex-wrap gap-1">
          {REQUEST_STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === f.key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts[f.key] || 0}
              </span>
            </button>
          ))}
        </div>
      )}
      {sortBy === 'completed' && (
        <div className="card p-1.5 inline-flex flex-wrap gap-1 border-emerald-200 bg-emerald-50/30">
          <span className="px-4 py-2 text-sm font-medium text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            最近办结视图
          </span>
          {([
            { key: 'today', label: '今天', rangeMs: 24 * 60 * 60 * 1000 },
            { key: 'week', label: '最近一周', rangeMs: 7 * 24 * 60 * 60 * 1000 },
            { key: 'month', label: '最近一月', rangeMs: 30 * 24 * 60 * 60 * 1000 },
            { key: 'all', label: '全部', rangeMs: Infinity },
          ] as const).map((r) => {
            const count = archiveRequests.filter((x) =>
              x.status === 'completed' &&
              x.completedAt &&
              x.completedAt >= (r.rangeMs === Infinity ? 0 : Date.now() - r.rangeMs)
            ).length;
            return (
              <button
                key={r.key}
                onClick={() => setCompletedRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  completedRange === r.key
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {r.label}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  completedRange === r.key ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 搜索栏 */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题、档案编号、档案名称、申请人..."
            className="input pl-10"
          />
        </div>
        <div className="card p-1 inline-flex gap-0.5">
          <button
            onClick={() => setSortBy('created')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              sortBy === 'created' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            按申请时间
          </button>
          <button
            onClick={() => setSortBy('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              sortBy === 'completed' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            按完成时间
          </button>
        </div>
        <button className="btn-secondary">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      {/* 列表 */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>申请信息</th>
                <th>档案密级</th>
                <th>申请人</th>
                <th>借阅期限</th>
                <th>{sortBy === 'completed' ? '完成时间' : '申请时间'}</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无符合条件的调卷申请</p>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const status = REQUEST_STATUS_MAP[req.status];
                  const secrecy = SECRECY_LEVEL_MAP[req.secrecyLevel];
                  return (
                    <tr key={req.id} className="group">
                      <td>
                        <div
                          onClick={() => navigate(`/approval/${req.id}`)}
                          className="cursor-pointer"
                        >
                          <div className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                            {req.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span className="font-mono text-slate-600">{req.archiveNo}</span>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{req.archiveName}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge border ${secrecy.bgColor} ${secrecy.color}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {secrecy.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {req.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {req.userName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {req.userDepartment}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-slate-700">{req.borrowPeriod}</div>
                      </td>
                      <td>
                        {sortBy === 'completed' && req.completedAt ? (
                          <>
                            <div className="text-sm text-emerald-700 font-medium">{formatTime(req.completedAt)}</div>
                            <div className="text-xs text-emerald-500 mt-0.5">{formatRelativeTime(req.completedAt)}办结</div>
                          </>
                        ) : sortBy === 'completed' ? (
                          <>
                            <div className="text-sm text-slate-400">—</div>
                            <div className="text-xs text-slate-400 mt-0.5">尚未办结</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-slate-700">{formatTime(req.createdAt)}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(req.createdAt)}</div>
                          </>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${status.bgColor} ${status.color}`}>
                          {req.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {(req.status === 'approving' || req.status === 'checking') && (
                            <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          )}
                          {req.status === 'queuing' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/approval/${req.id}`}
                          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          查看详情
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
