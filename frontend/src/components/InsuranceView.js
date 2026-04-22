import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign, FileText, Plus, RefreshCw, TrendingUp,
  TrendingDown, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const STATUS_COLORS = {
  pending:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  submitted:{ bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'  },
  accepted: { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/20'},
  denied:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'   },
  paid:     { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20'},
};

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border capitalize ${c.bg} ${c.text} ${c.border}`}>
      {status === 'pending'   && <Clock className="w-3 h-3" />}
      {status === 'accepted'  && <CheckCircle className="w-3 h-3" />}
      {status === 'paid'      && <CheckCircle className="w-3 h-3" />}
      {status === 'denied'    && <XCircle className="w-3 h-3" />}
      {status === 'submitted' && <AlertCircle className="w-3 h-3" />}
      {status}
    </span>
  );
};

const InsuranceView = () => {
  const [claims, setClaims]       = useState([]);
  const [reports, setReports]     = useState(null);
  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [activeTab, setActiveTab] = useState('claims');
  const [expandedRow, setExpandedRow] = useState(null);
  const [updating, setUpdating]   = useState(null);
  const [form, setForm] = useState({
    patient_id: '', insurer_name: '', policy_number: '',
    billed_amount: '', diagnosis_codes: '', procedure_codes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [claimsRes, reportsRes, patientsRes] = await Promise.all([
        axios.get(`${API}/insurance/claims`, { withCredentials: true }),
        axios.get(`${API}/insurance/reports`, { withCredentials: true }),
        axios.get(`${API}/patients`, { withCredentials: true }),
      ]);
      setClaims(claimsRes.data);
      setReports(reportsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Insurance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/insurance/claims`, {
        patient_id:     form.patient_id,
        insurer_name:   form.insurer_name,
        policy_number:  form.policy_number,
        billed_amount:  parseFloat(form.billed_amount),
        diagnosis_codes:  form.diagnosis_codes.split(',').map(s=>s.trim()).filter(Boolean),
        procedure_codes:  form.procedure_codes.split(',').map(s=>s.trim()).filter(Boolean),
      }, { withCredentials: true });
      setShowForm(false);
      setForm({ patient_id:'',insurer_name:'',policy_number:'',billed_amount:'',diagnosis_codes:'',procedure_codes:'' });
      fetchData();
    } catch (err) {
      console.error('Submit claim error:', err);
    }
  };

  const updateStatus = async (claimId, status) => {
    setUpdating(claimId);
    try {
      await axios.put(`${API}/insurance/claims/${claimId}/status`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  );

  const chartData = reports?.by_insurer?.map(b => ({
    name: b.insurer.length > 12 ? b.insurer.slice(0, 12) + '…' : b.insurer,
    Billed: b.billed,
    Paid: b.paid,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            💰 Insurance & Billing
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Manage insurance claims, track statuses and view billing reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Claim
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {reports && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Billed',   value: `$${reports.total_billed.toLocaleString()}`, icon: DollarSign,   color: 'text-blue-400'    },
            { label: 'Total Paid',     value: `$${reports.total_paid.toLocaleString()}`,   icon: TrendingUp,   color: 'text-emerald-400' },
            { label: 'Denial Rate',    value: `${reports.denial_rate}%`,                  icon: TrendingDown, color: 'text-red-400'     },
            { label: 'Total Claims',   value: reports.total_claims,                       icon: FileText,     color: 'text-violet-400'  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Claim Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Submit New Claim</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Patient *</label>
              <select required value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name} — {p.room_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Insurer Name *</label>
              <input required value={form.insurer_name} onChange={e => setForm({...form, insurer_name: e.target.value})}
                placeholder="e.g. BlueCross BlueShield"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Policy Number *</label>
              <input required value={form.policy_number} onChange={e => setForm({...form, policy_number: e.target.value})}
                placeholder="e.g. POL-2024-001"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Billed Amount ($) *</label>
              <input required type="number" step="0.01" value={form.billed_amount} onChange={e => setForm({...form, billed_amount: e.target.value})}
                placeholder="e.g. 4500.00"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">ICD Diagnosis Codes (comma-separated)</label>
              <input value={form.diagnosis_codes} onChange={e => setForm({...form, diagnosis_codes: e.target.value})}
                placeholder="e.g. J18.9, E11.9"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">CPT Procedure Codes (comma-separated)</label>
              <input value={form.procedure_codes} onChange={e => setForm({...form, procedure_codes: e.target.value})}
                placeholder="e.g. 99232, 71046"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">Submit Claim</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        {['claims', 'reports'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Claims Table */}
      {activeTab === 'claims' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Patient', 'Insurer', 'Policy #', 'Billed', 'Paid', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {claims.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No claims submitted yet.</td></tr>
              )}
              {claims.map(claim => {
                const patient = patients.find(p => p.patient_id === claim.patient_id);
                const isExpanded = expandedRow === claim.claim_id;
                return (
                  <React.Fragment key={claim.claim_id}>
                    <tr className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-200">{patient?.name || claim.patient_id}</td>
                      <td className="px-4 py-3 text-zinc-300">{claim.insurer_name}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{claim.policy_number}</td>
                      <td className="px-4 py-3 text-zinc-200">${claim.billed_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-400">{claim.paid_amount ? `$${claim.paid_amount.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={claim.status}
                            onChange={e => updateStatus(claim.claim_id, e.target.value)}
                            disabled={updating === claim.claim_id}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                          >
                            {['pending','submitted','accepted','denied','paid'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setExpandedRow(isExpanded ? null : claim.claim_id)} className="text-zinc-500 hover:text-zinc-300">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-zinc-800/20">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div><span className="text-zinc-500">Claim ID:</span> <span className="text-zinc-300 font-mono">{claim.claim_id}</span></div>
                            <div><span className="text-zinc-500">Allowed Amount:</span> <span className="text-zinc-300">{claim.allowed_amount ? `$${claim.allowed_amount}` : '—'}</span></div>
                            <div><span className="text-zinc-500">Submitted:</span> <span className="text-zinc-300">{claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '—'}</span></div>
                            <div><span className="text-zinc-500">Diagnosis Codes:</span> <span className="text-zinc-300">{claim.diagnosis_codes?.join(', ') || '—'}</span></div>
                            <div><span className="text-zinc-500">Procedure Codes:</span> <span className="text-zinc-300">{claim.procedure_codes?.join(', ') || '—'}</span></div>
                            {claim.denial_reason && <div><span className="text-zinc-500">Denial Reason:</span> <span className="text-red-400">{claim.denial_reason}</span></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && reports && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending',  val: reports.pending_count,  color: 'text-amber-400'   },
              { label: 'Accepted', val: reports.accepted_count, color: 'text-emerald-400' },
              { label: 'Denied',   val: reports.denied_count,   color: 'text-red-400'     },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{val}</p>
                <p className="text-zinc-500 text-sm mt-1">{label} Claims</p>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-sm font-medium text-zinc-300 mb-4">Billed vs Paid by Insurer</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    formatter={(value) => [`$${value.toLocaleString()}`]}
                  />
                  <Bar dataKey="Billed" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Paid"   fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reports.by_insurer?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Insurer', 'Claims', 'Total Billed', 'Total Paid', 'Collection Rate'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {reports.by_insurer.map(row => (
                    <tr key={row.insurer} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 text-zinc-200 font-medium">{row.insurer}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.count}</td>
                      <td className="px-4 py-3 text-zinc-300">${row.billed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-400">${row.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {row.billed > 0 ? `${Math.round((row.paid / row.billed) * 100)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsuranceView;
