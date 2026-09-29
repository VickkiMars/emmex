import React, { useState } from 'react';
import { 
  Search, 
  Eye, 
  Radio
} from 'lucide-react';
import type { HealthcareBreachRecord, SeverityLevel, MLModelSummary } from '../types';
import { AlertStream } from './AlertStream';
import { ThreatDetailsModal } from './ThreatDetailsModal';

interface ThreatMonitoringViewProps {
  dataset: HealthcareBreachRecord[];
  activeModel: MLModelSummary;
  isBackendConnected?: boolean;
}

export const ThreatMonitoringView: React.FC<ThreatMonitoringViewProps> = ({
  dataset,
  activeModel,
  isBackendConnected = false
}) => {
  const [selectedThreat, setSelectedThreat] = useState<HealthcareBreachRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<'All' | SeverityLevel>('All');

  const breachRecords = dataset.filter(r => r.isBreach === 1);
  const highCount = breachRecords.filter(r => r.severityLevel === 'High').length;
  const medCount = breachRecords.filter(r => r.severityLevel === 'Medium').length;
  const lowCount = breachRecords.filter(r => r.severityLevel === 'Low').length;

  const handleSelectThreat = (record: HealthcareBreachRecord) => {
    setSelectedThreat(record);
    setIsModalOpen(true);
  };

  const filteredBreaches = breachRecords.filter(r => {
    const matchesSev = activeSeverityFilter === 'All' || r.severityLevel === activeSeverityFilter;
    const matchesSearch = 
      r.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.breachType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.networkProtocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#e0e2e8] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#cee5ff]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cee5ff] text-[#001d33] rounded-full text-xs font-semibold border border-[#9ecaff]">
              <Radio className="w-3.5 h-3.5 text-[#00639b]" />
              <span>Real-Time Anomaly Stream & Threat Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c20] tracking-tight">
              Threat Monitoring & Anomaly Detection
            </h1>
            <p className="text-xs sm:text-sm text-[#51606f] max-w-2xl font-normal leading-relaxed">
              Continuously monitors live healthcare network packets and clinical EHR telemetry. Anomalies are classified in real time by the active <strong>{activeModel.modelName}</strong> classifier into High, Medium, and Low severity tiers.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="px-4 py-2 bg-[#ffdad6] border border-[#ffb4ab] rounded-2xl text-center">
              <span className="block text-[10px] font-bold text-[#ba1a1a] uppercase tracking-wider">HIGH</span>
              <span className="text-xl font-black text-[#410002]">{highCount}</span>
            </div>
            <div className="px-4 py-2 bg-[#ffddb8] border border-[#ffdcc0] rounded-2xl text-center">
              <span className="block text-[10px] font-bold text-[#825500] uppercase tracking-wider">MEDIUM</span>
              <span className="text-xl font-black text-[#2b1700]">{medCount}</span>
            </div>
            <div className="px-4 py-2 bg-[#d6f5e7] border border-[#a1e3c8] rounded-2xl text-center">
              <span className="block text-[10px] font-bold text-[#006c4c] uppercase tracking-wider">LOW</span>
              <span className="text-xl font-black text-[#002114]">{lowCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded AlertStream Component */}
      <AlertStream
        initialRecords={dataset}
        onSelectThreat={handleSelectThreat}
        isBackendConnected={isBackendConnected}
      />

      {/* Historical Anomaly Database & Categorized Feed */}
      <div className="bg-white rounded-3xl border border-[#e0e2e8] p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        
        {/* Search & Severity Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e2e8] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#191c20]">Historical Anomaly Repository</h2>
            <p className="text-xs text-[#51606f]">Categorized by the model's multi-tier severity output</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#72777f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search entity, protocol, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-xl text-xs text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex bg-[#f2f4fa] p-1 rounded-xl border border-[#e0e2e8] text-xs">
              {(['All', 'High', 'Medium', 'Low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setActiveSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeSeverityFilter === sev
                      ? 'bg-white text-[#191c20] font-bold shadow-xs'
                      : 'text-[#51606f] hover:text-[#191c20]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breach Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e0e2e8] text-[#51606f]">
                <th className="pb-3 font-semibold">Incident ID</th>
                <th className="pb-3 font-semibold">Healthcare Entity</th>
                <th className="pb-3 font-semibold">State</th>
                <th className="pb-3 font-semibold">Breach Vector</th>
                <th className="pb-3 font-semibold">Protocol</th>
                <th className="pb-3 font-semibold">Failed Logins</th>
                <th className="pb-3 font-semibold">Transfer Volume</th>
                <th className="pb-3 font-semibold">Severity Output</th>
                <th className="pb-3 font-semibold text-right">Forensic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e2e8]/60">
              {filteredBreaches.slice(0, 15).map((record) => {
                const isHigh = record.severityLevel === 'High';
                const isMed = record.severityLevel === 'Medium';
                const sevBadgeClass = isHigh
                  ? 'md3-badge-high'
                  : isMed
                  ? 'md3-badge-medium'
                  : 'md3-badge-low';

                return (
                  <tr key={record.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 font-mono text-[11px] text-[#51606f]">{record.id}</td>
                    <td className="py-3 font-bold text-[#191c20]">{record.entityName}</td>
                    <td className="py-3 font-semibold text-[#51606f]">{record.state}</td>
                    <td className="py-3 text-[#51606f]">{record.breachType}</td>
                    <td className="py-3 font-mono text-[11px] text-[#00639b]">{record.networkProtocol}</td>
                    <td className={`py-3 font-semibold ${record.failedLoginAttempts > 3 ? 'text-[#ba1a1a]' : 'text-[#191c20]'}`}>
                      {record.failedLoginAttempts}
                    </td>
                    <td className="py-3 font-semibold text-[#191c20]">
                      {record.unusualDataTransferMB.toFixed(1)} MB
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevBadgeClass}`}>
                        {record.severityLevel || 'Low'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleSelectThreat(record)}
                        className="px-3 py-1 bg-[#cee5ff] hover:bg-[#9ecaff] text-[#001d33] font-semibold rounded-full text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Context</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Details Modal */}
      <ThreatDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedThreat}
      />

    </div>
  );
};
