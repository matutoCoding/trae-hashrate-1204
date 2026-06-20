import { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Shield,
  ArrowUpRight,
  CheckCircle2,
  User,
  ChevronRight,
  Hourglass,
  Filter,
  TrendingUp,
  Users,
  Bell,
  Search,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { NODE_STATUS_MAP } from '@/types';
import { formatTime, formatRelativeTime, formatCountdown } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ReminderCenter() {
  const navigate = useNavigate();
  const { approvalNodes, archiveRequests, reminderLogs, acknowledgeReminder, triggerEscalation, currentUserId } = useAppStore();
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<'all' | 'mine' | 'warning' | 'escalated'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取所有活跃节点
  const activeNodes = approvalNodes.filter((n) => n.status === 'pending' || n.status === 'timeout' || n.status === 'escalated');

  const filteredNodes = activeNodes.filter((n) => {
    const req = archiveRequests.find((r) => r.id === n.requestId);
    const cd = formatCountdown(n.deadline);
    if (filter === 'mine' && n.approverId !== currentUserId) return false;
    if (filter === 'warning' && !cd.isOverdue && !cd.isWarning) return false;
    if (filter === 'escalated' && n.status !== 'escalated') return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !req?.title.toLowerCase().includes(s) &&
        !n.nodeName.toLowerCase().includes(s) &&
        !n.approverName.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  }).sort((a, b) => a.deadline - b.deadline);

  // 统计
  const totalActive = activeNodes.length;
  const overdueCount = activeNodes.filter((n) => formatCountdown(n.deadline).isOverdue).length;
  const warningCount = activeNodes.filter((n) => {
    const cd = formatCountdown(n.deadline);
    return !cd.isOverdue && cd.isWarning;
  }).length;
  const escalatedCount = activeNodes.filter((n) => n.status === 'escalated').length;
  const unacknowledgedCount = reminderLogs.filter((r) => !r.acknowledged).length;

  const sortedReminders = [...reminderLogs].sort((a, b) => b.triggeredAt - a.triggeredAt);

  const filters = [
    { key: 'all' as const, label: '全部节点', count: totalActive },
    { key: 'mine' as const, label: '我负责的', count: activeNodes.filter((n) => n.approverId === currentUserId).length },
    { key: 'warning' as const, label: '超时预警', count: overdueCount + warningCount },
    { key: 'escalated' as const, label: '已升级', count: escalatedCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Clock className="w-7 h-7 text-brand-500" />
          超时催办中心
        </h1>
        <p className="text-sm text-slate-500 mt-1">实时监控审批节点超时情况，自动升级催办并记录责任人</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: '活跃审批节点', value: totalActive, icon: Hourglass, color: 'from-blue-500 to-blue-700', desc: '正在处理中' },
          { label: '即将超时预警', value: warningCount, icon: Bell, color: 'from-amber-500 to-amber-600', desc: '剩余<10分钟' },
          { label: '已超时节点', value: overdueCount, icon: AlertTriangle, color: 'from-orange-500 to-red-600', desc: '需立即处理', danger: true },
          { label: '升级催办中', value: escalatedCount, icon: ArrowUpRight, color: 'from-rose-500 to-red-700', desc: '已转交上级', danger: true },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`stat-card hover:shadow-card-hover transition-all duration-300 ${s.danger && s.value > 0 ? 'animate-pulse-slow' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-4xl font-bold tracking-tight ${
                      s.danger && s.value > 0 ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {s.value}
                    </span>
                    <span className="text-xs text-slate-400">个</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：节点监控列表 */}
        <div className="xl:col-span-2 space-y-5">
          {/* 筛选栏 */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="card p-1.5 inline-flex gap-1 flex-wrap">
              {filters.map((f) => (
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
                placeholder="搜索节点、申请..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 节点列表 */}
          <div className="space-y-4">
            {filteredNodes.length === 0 ? (
              <div className="card p-16 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
                <p className="text-slate-500">太棒了！当前没有需要催办的审批节点</p>
              </div>
            ) : (
              filteredNodes.map((node) => {
                const req = archiveRequests.find((r) => r.id === node.requestId);
                const cd = formatCountdown(node.deadline);
                const isAssignedToMe = node.approverId === currentUserId;
                const overduePercent = cd.isOverdue
                  ? 100
                  : Math.min(100, 100 - ((node.deadline - Date.now()) / (node.timeoutMinutes * 60 * 1000)) * 100);
                const nodeReminders = reminderLogs.filter((r) => r.nodeId === node.id);

                return (
                  <div
                    key={node.id}
                    className={`card overflow-hidden hover:shadow-card-hover transition-all cursor-pointer ${
                      cd.isOverdue ? 'border-orange-300' : node.status === 'escalated' ? 'border-red-300' : cd.isWarning ? 'border-amber-200' : ''
                    }`}
                    onClick={() => navigate(`/approval/${node.requestId}`)}
                  >
                    {/* 进度条背景 */}
                    <div className="h-1.5 bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          cd.isOverdue
                            ? 'bg-gradient-to-r from-orange-500 to-red-500'
                            : node.status === 'escalated'
                            ? 'bg-red-500'
                            : overduePercent > 70
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-brand-400 to-brand-600'
                        }`}
                        style={{ width: `${overduePercent}%` }}
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 truncate">{req?.title}</h3>
                            {req && (
                              <span className={`badge border ${
                                req.secrecyLevel === 'public' ? 'bg-green-50 text-green-700 border-green-200' :
                                req.secrecyLevel === 'internal' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                req.secrecyLevel === 'secret' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {req.secrecyLevel === 'public' ? '公开' : req.secrecyLevel === 'internal' ? '内部' : req.secrecyLevel === 'secret' ? '秘密' : '绝密'}
                              </span>
                            )}
                            {isAssignedToMe && (
                              <span className="badge bg-brand-50 text-brand-700 border border-brand-200">
                                <User className="w-3 h-3 mr-1" />
                                我负责
                              </span>
                            )}
                            {node.status === 'escalated' && (
                              <span className="badge bg-red-50 text-red-700 border border-red-200 animate-pulse">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                已升级
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Filter className="w-3.5 h-3.5" />
                              节点：<span className="font-medium text-slate-700">{node.nodeName}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              审批人：<span className="font-medium text-slate-700">{node.approverName}（{node.approverTitle}）</span>
                            </span>
                            {nodeReminders.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                已催办：<span className="font-medium text-amber-600">{nodeReminders.length}次</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 倒计时 */}
                        <div className="text-right">
                          <div className={`text-xs font-medium mb-1 ${
                            cd.isOverdue ? 'text-red-600' : cd.isWarning ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {cd.isOverdue ? '已超时时间' : cd.isWarning ? '即将超时' : '剩余时间'}
                          </div>
                          <div className={`font-mono font-bold text-2xl tracking-wider ${
                            cd.isOverdue
                              ? 'text-red-600 animate-blink'
                              : cd.isWarning
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}>
                            {cd.text}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            截止 {formatTime(node.deadline)}
                          </div>
                          {isAssignedToMe && (cd.isOverdue || cd.isWarning) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerEscalation(node.id);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              升级催办
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 催办历史标签 */}
                      {nodeReminders.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap pt-3 border-t border-dashed border-slate-200">
                          <span className="text-xs text-slate-400">催办轨迹：</span>
                          {nodeReminders.map((r) => (
                            <span
                              key={r.id}
                              title={r.content}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.escalationLevel >= 3
                                  ? 'bg-red-100 text-red-700'
                                  : r.escalationLevel === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              Lv.{r.escalationLevel} → {r.handlerName}
                              {r.acknowledged ? (
                                <CheckCircle2 className="w-2.5 h-2.5 ml-0.5 text-emerald-600" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-red-500 ml-0.5 animate-pulse" />
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：催办记录时间线 */}
        <div className="space-y-5">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                催办记录时间线
                <span className="badge bg-amber-100 text-amber-700 ml-auto">
                  {unacknowledgedCount} 待签收
                </span>
              </h3>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {sortedReminders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  暂无催办记录
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedReminders.map((r, idx) => {
                    const isLast = idx === sortedReminders.length - 1;
                    return (
                      <div key={r.id} className="relative pl-6 pb-5">
                        {!isLast && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md ${
                          r.escalationLevel >= 3
                            ? 'bg-red-500 text-white'
                            : r.escalationLevel === 2
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-500 text-white'
                        } ${!r.acknowledged ? 'animate-pulse' : ''}`}>
                          L{r.escalationLevel}
                        </div>
                        <div className={`rounded-xl border p-3.5 transition-all ${
                          !r.acknowledged
                            ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`badge text-[10px] ${
                              r.escalationLevel >= 3
                                ? 'bg-red-100 text-red-700'
                                : r.escalationLevel === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {r.escalationLevel >= 3 ? '紧急督办' : r.escalationLevel === 2 ? '升级催办' : '超时提醒'}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {formatRelativeTime(r.triggeredAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                            {r.content}
                          </p>
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Users className="w-3 h-3" />
                              责任人：
                              <span className="font-medium text-slate-700">{r.handlerName}</span>
                              <span className="text-slate-400">（{r.handlerTitle}）</span>
                            </div>
                            {r.acknowledged ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                已签收
                              </span>
                            ) : (
                              <button
                                onClick={() => acknowledgeReminder(r.id)}
                                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium hover:underline"
                              >
                                立即签收
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            触发时间：{formatTime(r.triggeredAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 催办规则说明 */}
          <div className="card border-brand-200 bg-brand-50/30">
            <div className="p-5">
              <h4 className="font-semibold text-brand-900 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                催办升级规则说明
              </h4>
              <div className="mt-3 space-y-2.5">
                {[
                  { level: 1, title: '超时提醒', desc: '节点到达时限，自动通知审批人', color: 'text-amber-600', bg: 'bg-amber-100' },
                  { level: 2, title: '升级催办', desc: '超时×2，升级至部门主管督办', color: 'text-orange-600', bg: 'bg-orange-100' },
                  { level: 3, title: '紧急督办', desc: '超时×3，升级至分管局领导', color: 'text-red-600', bg: 'bg-red-100' },
                ].map((r) => (
                  <div key={r.level} className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.bg} ${r.color} flex-shrink-0`}>
                      Lv.{r.level}
                    </span>
                    <div>
                      <div className={`text-xs font-semibold ${r.color}`}>{r.title}</div>
                      <div className="text-[11px] text-slate-600">{r.desc}</div>
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
