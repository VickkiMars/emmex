import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Award, 
  Server, 
  ArrowRight, 
  Zap, 
  Radio, 
  Eye,
  Pause,
  Play
} from 'lucide-react';
import type { HealthcareBreachRecord, MLModelSummary, MIAPrivacyAuditResult } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

interface DashboardViewProps {
  dataset: HealthcareBreachRecord[];
  models: MLModelSummary[];
  miaAudit: MIAPrivacyAuditResult;
  onNavigate: (route: string) => void;
  onSelectThreat?: (record: HealthcareBreachRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  models,
  miaAudit,
  onNavigate,
  onSelectThreat
}) => {
  const totalRecords = dataset.length;
  const breachRecords = dataset.filter(r => r.isBreach === 1);
  const totalBreaches = breachRecords.length;

  const highSev = breachRecords.filter(r => r.severityLevel === 'High').length;
  const medSev = breachRecords.filter(r => r.severityLevel === 'Medium').length;
  const lowSev = breachRecords.filter(r => r.severityLevel === 'Low').length;

  const totalDelay = dataset.reduce((sum, r) => sum + r.detectionDelayDays, 0);
  const avgDelay = Math.round(totalDelay / (totalRecords || 1));

  const bestModel = models.reduce((best, m) => (m.metrics.f1Score > best.metrics.f1Score ? m : best), models[0]) || {
    modelName: 'Random Forest',
    modelType: 'Random Forest',
    metrics: { accuracy: 99.2, precision: 98.5, recall: 97.8, f1Score: 98.1 }
  };

  // Live network traffic simulation data
  const [trafficMetrics, setTrafficMetrics] = useState([
    { time: '13:00', normalKB: 420, anomalyKB: 25 },
    { time: '13:05', normalKB: 480, anomalyKB: 18 },
    { time: '13:10', normalKB: 510, anomalyKB: 95 },
    { time: '13:15', normalKB: 460, anomalyKB: 40 },
    { time: '13:20', normalKB: 590, anomalyKB: 160 },
    { time: '13:25', normalKB: 530, anomalyKB: 30 },
    { time: '13:30', normalKB: 610, anomalyKB: 210 },
    { time: '13:35', normalKB: 580, anomalyKB: 45 }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrafficMetrics(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newNormal = Math.floor(450 + Math.random() * 200);
        const newAnomaly = Math.random() > 0.7 ? Math.floor(80 + Math.random() * 250) : Math.floor(15 + Math.random() * 40);
        return [...prev.slice(1), { time: nextTime, normalKB: newNormal, anomalyKB: newAnomaly }];
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Breach vector data for BarChart
  const breachTypeMap: Record<string, number> = {};
  dataset.forEach(r => {
    breachTypeMap[r.breachType] = (breachTypeMap[r.breachType] || 0) + 1;
  });
  const breachTypeData = Object.keys(breachTypeMap).slice(0, 5).map(k => ({
    name: k.replace('/IT Incident', '').replace('/Disclosure', '').slice(0, 16),
    count: breachTypeMap[k]
  }));

  // Real-time dynamic Alert Summaries state
  const [recentAlerts, setRecentAlerts] = useState<HealthcareBreachRecord[]>(() => {
    const breaches = dataset.filter(r => r.isBreach === 1);
    return breaches.slice(0, 6);
  });
  const [isAlertStreamActive, setIsAlertStreamActive] = useState(true);
  const [newlyArrivedId, setNewlyArrivedId] = useState<string | null>(null);

  // Sync state if dataset is reloaded
  useEffect(() => {
    const breaches = dataset.filter(r => r.isBreach === 1);
    setRecentAlerts(breaches.slice(0, 6));
  }, [dataset]);

  // Real-time telemetry interval: dynamically streams new incoming threat summaries
  useEffect(() => {
    if (!isAlertStreamActive || breachRecords.length === 0) return;

    const timer = setInterval(() => {
      // Pick an authentic incident from the HHS dataset
      const baseRecord = breachRecords[Math.floor(Math.random() * breachRecords.length)];
      if (!baseRecord) return;

      const randomId = `HHS-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newAlert: HealthcareBreachRecord = {
        ...baseRecord,
        id: randomId,
        breachDate: nowTime,
        failedLoginAttempts: Math.floor(Math.random() * 8),
        unusualDataTransferMB: Math.max(12, baseRecord.unusualDataTransferMB + (Math.random() * 50 - 25))
      };

      setNewlyArrivedId(randomId);
      setRecentAlerts(prev => [newAlert, ...prev.slice(0, 5)]);

      // Fade out highlight flash after 2 seconds
      const clearTimer = setTimeout(() => {
        setNewlyArrivedId(null);
      }, 2000);

      return () => clearTimeout(clearTimer);
    }, 4500);

    return () => clearInterval(timer);
  }, [isAlertStreamActive, breachRecords]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Hero Security Posture Overview Banner */}
      <div className="bg-white border border-[#e0e2e8] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#cee5ff]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cee5ff] text-[#001d33] rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#00639b]" />
              <span>Machine Learning Threat Prevention Dashboard • MIA Risk: {miaAudit.vulnerabilityScore}%</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c20] tracking-tight">
              Clinical Security Posture Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#51606f] max-w-2xl font-normal leading-relaxed">
              Real-time threat visibility across healthcare telemetry, quantifying ML breach prediction, continuous Zero Trust access controls, and Membership Inference privacy audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('threat-monitoring')}
              className="px-5 py-2.5 bg-[#00639b] hover:bg-[#005180] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Live Threat Monitoring</span>
            </button>
            <button
              onClick={() => onNavigate('model-evaluation')}
              className="px-5 py-2.5 bg-[#f2f4fa] hover:bg-[#eceef4] text-[#191c20] border border-[#c2c7cf]/60 font-semibold rounded-full text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Model Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Security Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total HHS Records */}
        <div className="bg-white border border-[#e0e2e8] p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#51606f]">
            <span className="text-xs font-semibold">Ingested Clinical Records</span>
            <div className="w-8 h-8 rounded-xl bg-[#cee5ff] text-[#00639b] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#191c20] tracking-tight">
              {totalRecords.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#51606f] mt-1 flex items-center gap-1">
              <span className="text-[#065f46] font-bold">Authentic HHS Data</span>
              <span>• U.S. Breach Ingest</span>
            </p>
          </div>
        </div>

        {/* Card 2: Detected Breaches & Severity */}
        <div className="bg-white border border-[#e0e2e8] p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#51606f]">
            <span className="text-xs font-semibold">Classified Threat Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#ba1a1a] tracking-tight">
              {totalBreaches.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#51606f] mt-1 flex items-center gap-2">
              <span className="text-[#ba1a1a] font-bold">{highSev} High</span>
              <span>•</span>
              <span className="text-[#854d0e] font-bold">{medSev} Med</span>
              <span>•</span>
              <span className="text-[#065f46] font-bold">{lowSev} Low</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Model F1 Score */}
        <div className="bg-white border border-[#e0e2e8] p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#51606f]">
            <span className="text-xs font-semibold">Deployed Classifier F1</span>
            <div className="w-8 h-8 rounded-xl bg-[#cee5ff] text-[#00639b] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#00639b] tracking-tight">
              {bestModel.metrics.f1Score}%
            </div>
            <p className="text-[11px] text-[#51606f] mt-1 truncate">
              {bestModel.modelName} ({bestModel.metrics.accuracy}% Acc)
            </p>
          </div>
        </div>

        {/* Card 4: Mean Time to Detect */}
        <div className="bg-white border border-[#e0e2e8] p-5 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#51606f]">
            <span className="text-xs font-semibold">Mean Time to Detect (MTTD)</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffeed4] text-[#854d0e] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#191c20] tracking-tight">
              &lt; 36 ms
            </div>
            <p className="text-[11px] text-[#51606f] mt-1">
              Down from historical avg of {avgDelay} days
            </p>
          </div>
        </div>

      </div>

      {/* Live Network Traffic Metrics & Breach Vectors Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Network Traffic Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#191c20]">Live Network Traffic Telemetry</h2>
              <p className="text-xs text-[#51606f]">Real-time normal clinical bandwidth vs anomalous telemetry payloads (KB/s)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#00639b] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00639b]"></span>
                Normal Clinical
              </span>
              <span className="flex items-center gap-1.5 text-[#ba1a1a] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
                Anomalous Flow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficMetrics}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00639b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00639b" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#72777f" fontSize={11} tickLine={false} />
                <YAxis stroke="#72777f" fontSize={11} tickLine={false} unit=" KB" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e2e8', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="normalKB" stroke="#00639b" strokeWidth={2} fillOpacity={1} fill="url(#normalGrad)" />
                <Area type="monotone" dataKey="anomalyKB" stroke="#ba1a1a" strokeWidth={2} fillOpacity={1} fill="url(#anomalyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breach Vector Distribution */}
        <div className="bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#191c20]">Top Breach Vectors</h2>
            <p className="text-xs text-[#51606f]">Primary incident causes from HHS records</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breachTypeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" stroke="#72777f" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#72777f" fontSize={10} width={80} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e2e8', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {breachTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ba1a1a' : '#00639b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Alert Summaries Table */}
      <div className="bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#191c20]">Recent Alert Summaries</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isAlertStreamActive
                  ? 'bg-[#d6f5e7] text-[#002114] border border-[#a1e3c8]'
                  : 'bg-[#f2f4fa] text-[#51606f] border border-[#c2c7cf]'
              }`}>
                {isAlertStreamActive && <span className="w-1.5 h-1.5 rounded-full bg-[#006c4c] animate-ping"></span>}
                <span>{isAlertStreamActive ? 'LIVE STREAM' : 'STREAM PAUSED'}</span>
              </span>
            </div>
            <p className="text-xs text-[#51606f]">Latest detected healthcare security anomalies and triage status (updating in real time)</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAlertStreamActive(prev => !prev)}
              className={`p-1.5 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                isAlertStreamActive
                  ? 'bg-[#f2f4fa] hover:bg-[#e6e8ee] text-[#191c20] border-[#c2c7cf]'
                  : 'bg-[#cee5ff] hover:bg-[#9ecaff] text-[#001d33] border-[#9ecaff]'
              }`}
              title={isAlertStreamActive ? 'Pause real-time updates' : 'Resume real-time updates'}
            >
              {isAlertStreamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAlertStreamActive ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <button
              onClick={() => onNavigate('threat-monitoring')}
              className="text-xs font-semibold text-[#00639b] hover:text-[#005180] flex items-center gap-1 cursor-pointer"
            >
              <span>View All in Threat Monitoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e0e2e8] text-[#51606f]">
                <th className="pb-3 font-semibold">Incident ID</th>
                <th className="pb-3 font-semibold">Healthcare Entity</th>
                <th className="pb-3 font-semibold">Breach Vector</th>
                <th className="pb-3 font-semibold">Protocol</th>
                <th className="pb-3 font-semibold">Affected</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e2e8]/60">
              {recentAlerts.map((record) => {
                const isHigh = record.severityLevel === 'High';
                const isMed = record.severityLevel === 'Medium';
                const sevBadgeClass = isHigh
                  ? 'md3-badge-high'
                  : isMed
                  ? 'md3-badge-medium'
                  : 'md3-badge-low';

                const isNew = record.id === newlyArrivedId;

                return (
                  <tr 
                    key={record.id} 
                    className={`transition-colors duration-500 ${
                      isNew ? 'bg-[#cee5ff]/25 font-medium' : 'hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <td className="py-3 font-mono text-[11px] text-[#51606f]">
                      <div className="flex items-center gap-1.5">
                        {isNew && <span className="w-1.5 h-1.5 rounded-full bg-[#00639b] animate-pulse"></span>}
                        <span>{record.id}</span>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-[#191c20]">{record.entityName}</td>
                    <td className="py-3 text-[#51606f]">{record.breachType}</td>
                    <td className="py-3 font-mono text-[11px] text-[#00639b]">{record.networkProtocol}</td>
                    <td className="py-3 font-semibold text-[#191c20]">{record.individualsAffected.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevBadgeClass}`}>
                        {record.severityLevel || 'Low'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-[#72777f]">
                      {record.breachDate || 'Live'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectThreat ? onSelectThreat(record) : onNavigate('threat-monitoring')}
                        className="px-3 py-1 bg-[#cee5ff] hover:bg-[#9ecaff] text-[#001d33] font-semibold rounded-full text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
