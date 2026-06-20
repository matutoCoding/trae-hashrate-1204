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

  const filtered = archiveRequests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
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
  }).sort((a, b) => b.createdAt - a.createdAt);

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
                <th>申请时间</th>
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
                        <div className="text-sm text-slate-700">{formatTime(req.createdAt)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(req.createdAt)}</div>
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
