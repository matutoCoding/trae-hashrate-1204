import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  Clock,
  Users2,
  AlertTriangle,
  Ticket,
  MonitorSpeaker,
  Settings2,
  LogOut,
  Shield,
  RotateCcw,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store';
import { mockUsers } from '@/data/mockData';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/approval', label: '调卷审批', icon: FileCheck2 },
  { path: '/reminder', label: '超时催办', icon: Clock },
  {
    label: '排队叫号',
    icon: Users2,
    children: [
      { path: '/queue', label: '叫号大屏', icon: MonitorSpeaker },
      { path: '/queue/manage', label: '叫号管理', icon: Settings2 },
      { path: '/queue/take', label: '取号排队', icon: Ticket },
    ],
  },
  { path: '/overtime', label: '过号处理', icon: AlertTriangle },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUserId, setCurrentUser, resetData } = useAppStore();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('排队叫号');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentUser = mockUsers.find((u) => u.id === currentUserId) || mockUsers[0];
  const unreadReminders = useAppStore((s) => s.reminderLogs.filter((r) => !r.acknowledged).length);
  const pendingApprovals = useAppStore((s) =>
    s.approvalNodes.filter((n) => n.status === 'pending' || n.status === 'timeout').length
  );

  const isPathActive = (path: string) => {
    if (path.includes('manage') || path.includes('take')) {
      return location.pathname === path;
    }
    if (path === '/queue') {
      return location.pathname === '/queue';
    }
    return location.pathname.startsWith(path);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据到初始状态吗？')) {
      resetData();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">档案调卷系统</h1>
            <p className="text-[10px] text-slate-500 leading-tight">Archive Retrieval System</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if ('children' in item) {
              const isExpanded = expandedMenu === item.label;
              const hasActiveChild = item.children.some((c) => isPathActive(c.path));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                    className={`nav-item w-full ${hasActiveChild && !isExpanded ? 'bg-brand-50 text-brand-700' : 'nav-item-inactive'}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-5 pl-4 border-l-2 border-slate-200 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item text-xs py-2 ${isPathActive(child.path) ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isPathActive(item.path) ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.label === '超时催办' && unreadReminders > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadReminders}
                  </span>
                )}
                {item.label === '调卷审批' && pendingApprovals > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingApprovals}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <button
            onClick={handleReset}
            className="nav-item w-full nav-item-inactive text-slate-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs">重置模拟数据</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索档案编号、申请标题..."
                className="input pl-10 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reminder')}
              className="relative w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadReminders > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{currentUser.title}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-semibold text-slate-900 text-sm">{currentUser.name}</div>
                    <div className="text-xs text-slate-500">{currentUser.department}</div>
                    <div className="mt-1">
                      <span className="badge bg-brand-50 text-brand-700">
                        <Shield className="w-3 h-3 mr-1" />
                        权限：{currentUser.clearanceLevel === 'public' ? '公开' : currentUser.clearanceLevel === 'internal' ? '内部' : currentUser.clearanceLevel === 'secret' ? '秘密' : '绝密'}
                      </span>
                    </div>
                  </div>
                  <div className="py-1">
                    <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase">切换身份</div>
                    {mockUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${u.id === currentUserId ? 'bg-brand-50 text-brand-700' : 'text-slate-700'}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                          {u.name.charAt(0)}
                        </div>
                        <span className="flex-1 text-left">{u.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {u.role === 'requester' ? '申请人' : u.role === 'approver' ? '审批人' : '管理员'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
