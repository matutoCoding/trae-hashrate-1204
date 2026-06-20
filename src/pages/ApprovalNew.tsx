import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  CalendarDays,
  Hash,
  FileWarning,
  User,
  Building,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { mockUsers } from '@/data/mockData';
import { SECRECY_LEVEL_MAP, type SecrecyLevel } from '@/types';
import { checkClearance, getApprovalNodesBySecrecy } from '@/utils';

export default function ApprovalNew() {
  const navigate = useNavigate();
  const { createRequest, currentUserId } = useAppStore();
  const currentUser = mockUsers.find((u) => u.id === currentUserId) || mockUsers[0];

  const [form, setForm] = useState({
    title: '',
    archiveNo: '',
    archiveName: '',
    secrecyLevel: 'internal' as SecrecyLevel,
    reason: '',
    borrowStart: '',
    borrowEnd: '',
    userId: currentUserId,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; requestId?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedUser = mockUsers.find((u) => u.id === form.userId) || currentUser;
  const clearanceCheck = checkClearance(selectedUser.clearanceLevel, form.secrecyLevel);
  const approvalFlow = getApprovalNodesBySecrecy(form.secrecyLevel);

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v } as typeof form));
    if (k === 'userId') {
      setShowPreview(true);
    }
    if (result) setResult(null);
  };

  const secrecyLevels: SecrecyLevel[] = ['public', 'internal', 'secret', 'top-secret'];

  const canSubmit =
    form.title.trim() &&
    form.archiveNo.trim() &&
    form.archiveName.trim() &&
    form.reason.trim() &&
    form.borrowStart &&
    form.borrowEnd &&
    clearanceCheck.pass;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    setTimeout(() => {
      const res = createRequest({
        title: form.title,
        archiveNo: form.archiveNo,
        archiveName: form.archiveName,
        secrecyLevel: form.secrecyLevel,
        reason: form.reason,
        borrowPeriod: `${form.borrowStart} 至 ${form.borrowEnd}`,
        userId: form.userId,
      });
      setResult(res);
      setSubmitting(false);

      if (res.success) {
        setTimeout(() => {
          navigate(`/approval/${res.requestId}`);
        }, 1500);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/approval')} className="btn-secondary py-2 px-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">发起调卷申请</h1>
          <p className="text-sm text-slate-500 mt-1">填写调卷事由，系统将自动核验权限并进入审批流程</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 表单区 */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                申请人信息
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">选择申请人</label>
                  <select
                    className="select"
                    value={form.userId}
                    onChange={(e) => update('userId', e.target.value)}
                  >
                    {mockUsers.filter((u) => u.role === 'requester' || u.role === 'admin').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.department}（{u.title}）
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">权限等级</label>
                  <div className={`border rounded-lg px-3.5 py-2.5 flex items-center gap-2 ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].bgColor} border-2`}>
                    <Shield className={`w-4 h-4 ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].color}`} />
                    <span className={`font-medium ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].color}`}>
                      {SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].label}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      来自用户档案
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  {selectedUser.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {selectedUser.title}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                档案信息
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">调卷事由标题 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="请简明描述调卷事由，如：2023年度财务审计档案调阅"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  maxLength={100}
                />
                <div className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/100</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">档案编号 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="input pl-10 font-mono"
                      placeholder="如：FIN-2023-0089"
                      value={form.archiveNo}
                      onChange={(e) => update('archiveNo', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">档案密级 <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-4 gap-2">
                    {secrecyLevels.map((lvl) => {
                      const info = SECRECY_LEVEL_MAP[lvl];
                      const isSelected = form.secrecyLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            update('secrecyLevel', lvl);
                            setShowPreview(true);
                          }}
                          className={`relative px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? `${info.bgColor} ${info.color} border-current shadow-sm`
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5 mx-auto mb-1" />
                          <div>{info.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="label">档案名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入档案完整名称"
                  value={form.archiveName}
                  onChange={(e) => update('archiveName', e.target.value)}
                />
              </div>

              <div>
                <label className="label">详细调卷事由 <span className="text-red-500">*</span></label>
                <textarea
                  className="textarea"
                  placeholder="请详细说明调卷的目的、用途和必要性..."
                  rows={5}
                  value={form.reason}
                  onChange={(e) => update('reason', e.target.value)}
                  maxLength={500}
                />
                <div className="text-xs text-slate-400 mt-1 text-right">{form.reason.length}/500</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-500" />
                借阅期限
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">借阅起始日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="input"
                    value={form.borrowStart}
                    onChange={(e) => update('borrowStart', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="label">借阅截止日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="input"
                    value={form.borrowEnd}
                    onChange={(e) => update('borrowEnd', e.target.value)}
                    min={form.borrowStart || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧预览 */}
        <div className="space-y-5">
          {/* 权限核验 */}
          <div className={`card border-2 ${clearanceCheck.pass ? 'border-emerald-200' : 'border-red-200'}`}>
            <div className={`p-4 rounded-t-xl ${clearanceCheck.pass ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className={`flex items-center gap-2 ${clearanceCheck.pass ? 'text-emerald-700' : 'text-red-700'}`}>
                {clearanceCheck.pass ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-bold">密级权限核验</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">用户权限</span>
                <span className={`badge border ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].bgColor} ${SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].color}`}>
                  {SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].label}（Lv.{SECRECY_LEVEL_MAP[selectedUser.clearanceLevel].level}）
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">档案密级</span>
                <span className={`badge border ${SECRECY_LEVEL_MAP[form.secrecyLevel].bgColor} ${SECRECY_LEVEL_MAP[form.secrecyLevel].color}`}>
                  {SECRECY_LEVEL_MAP[form.secrecyLevel].label}（Lv.{SECRECY_LEVEL_MAP[form.secrecyLevel].level}）
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                {clearanceCheck.pass ? (
                  <p className="text-xs text-emerald-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>权限核验通过，用户有权调阅该等级档案</span>
                  </p>
                ) : (
                  <p className="text-xs text-red-600 flex items-start gap-1.5">
                    <FileWarning className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{clearanceCheck.reason}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 审批流程预览 */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-brand-500" />
                审批流程预览
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {approvalFlow.map((node, idx) => (
                  <div key={node.nodeOrder} className="relative pl-6">
                    {idx < approvalFlow.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-12px] w-0.5 bg-slate-200" />
                    )}
                    <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {node.nodeOrder}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="font-medium text-slate-900 text-sm">{node.nodeName}</div>
                      <div className="text-xs text-slate-500 mt-1">{node.approverName} · {node.approverTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-1">超时时限：{node.timeoutMinutes}分钟</div>
                    </div>
                  </div>
                ))}
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    ✓
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="font-medium text-emerald-800 text-sm">审批通过</div>
                    <div className="text-xs text-emerald-600 mt-1">自动进入排队叫号队列</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 提交结果 */}
          {result && (
            <div className={`card border-2 ${result.success ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className={`p-5 ${result.success ? 'bg-emerald-50/50' : 'bg-red-50/50'}`}>
                <div className={`flex items-center gap-3 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                  {result.success ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                  <div>
                    <div className="font-bold text-base">
                      {result.success ? '提交成功！' : '提交失败'}
                    </div>
                    <div className="text-sm opacity-90 mt-0.5">{result.message}</div>
                    {result.success && (
                      <div className="text-xs mt-1 opacity-75">正在跳转到详情页...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="space-y-3 sticky bottom-6">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="btn-primary w-full py-3 text-base"
            >
              <Send className="w-5 h-5" />
              {submitting ? '提交中...' : '提交调卷申请'}
            </button>
            <button
              onClick={() => navigate('/approval')}
              className="btn-secondary w-full"
            >
              取消并返回
            </button>
            {!canSubmit && !clearanceCheck.pass && (
              <p className="text-xs text-red-600 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {clearanceCheck.reason}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
