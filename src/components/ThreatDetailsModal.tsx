import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Server, 
  Users, 
  Clock, 
  Network, 
  Activity, 
  AlertTriangle,
  FileText,
  Lock
} from 'lucide-react';
import type { HealthcareBreachRecord } from '../types';

interface ThreatDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HealthcareBreachRecord | null;
}

export const ThreatDetailsModal: React.FC<ThreatDetailsModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  if (!isOpen || !record) return null;

  const isHigh = record.severityLevel === 'High';
  const isMed = record.severityLevel === 'Medium';

  const severityBadgeClass = isHigh
    ? 'md3-badge-high'
    : isMed
    ? 'md3-badge-medium'
    : 'md3-badge-low';

  return (
    <div className="fixed inset-0 z-50 bg-[#001d33]/55 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#e0e2e8] shadow-2xl p-6 sm:p-8 space-y-6 my-auto relative text-[#191c20]">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e0e2e8] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isHigh ? 'bg-[#ffdad6] text-[#ba1a1a]' : isMed ? 'bg-[#ffddb8] text-[#825500]' : 'bg-[#d6f5e7] text-[#006c4c]'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#51606f]">{record.id}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadgeClass}`}>
                  {record.severityLevel || 'Low'} Severity
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f2f4fa] text-[#51606f]">
                  {record.isBreach ? 'CONFIRMED ANOMALY' : 'BENIGN EVENT'}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-[#191c20] mt-0.5">
                {record.entityName}
              </h2>
              <p className="text-xs text-[#51606f]">
                {record.entityType} • {record.state}, United States
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#72777f] hover:text-[#191c20] p-1.5 rounded-full hover:bg-[#f2f4fa] transition cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anomaly Trigger Diagnostic Banner */}
        <div className="bg-[#f8f9ff] border border-[#c2c7cf]/40 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#191c20]">
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
            <span>Forensic Anomaly Trigger Analysis</span>
          </div>
          <p className="text-xs text-[#51606f] leading-relaxed">
            {record.failedLoginAttempts > 3 && record.unusualDataTransferMB > 200
              ? 'Multi-vector threat signature detected: Concurrent credential brute-force attempts combined with massive bulk PHI data exfiltration over the clinical network.'
              : record.unusualDataTransferMB > 150
              ? 'Volumetric telemetry anomaly: Abnormal outbound data transfer volume deviating by >3 standard deviations from baseline clinical workflows.'
              : record.failedLoginAttempts > 3
              ? 'Identity violation: Repeated authentication failures indicating potential brute-force or unauthorized credential spraying.'
              : 'Statistical baseline deviation: Anomaly identified through correlated telemetry indicators and delay parameters.'}
          </p>
        </div>

        {/* Feature Grid Breakdown */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#51606f] mb-3">
            Trigger Feature Context & Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Users className="w-3.5 h-3.5" />
                <span>Affected Individuals</span>
              </div>
              <p className="text-sm font-bold text-[#191c20] mt-1">
                {record.individualsAffected.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Clock className="w-3.5 h-3.5" />
                <span>Detection Delay</span>
              </div>
              <p className="text-sm font-bold text-[#191c20] mt-1">
                {record.detectionDelayDays} Days
              </p>
            </div>

            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Network className="w-3.5 h-3.5" />
                <span>Network Protocol</span>
              </div>
              <p className="text-sm font-bold text-[#191c20] mt-1">
                {record.networkProtocol}
              </p>
            </div>

            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Lock className="w-3.5 h-3.5" />
                <span>Failed Logins</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${record.failedLoginAttempts > 3 ? 'text-[#ba1a1a]' : 'text-[#191c20]'}`}>
                {record.failedLoginAttempts} Attempts
              </p>
            </div>

            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Activity className="w-3.5 h-3.5" />
                <span>Data Transfer</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${record.unusualDataTransferMB > 100 ? 'text-[#ba1a1a]' : 'text-[#191c20]'}`}>
                {record.unusualDataTransferMB.toFixed(1)} MB
              </p>
            </div>

            <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
                <Server className="w-3.5 h-3.5" />
                <span>Avg Packet Length</span>
              </div>
              <p className="text-sm font-bold text-[#191c20] mt-1">
                {Math.round(record.packetLengthAvg)} bytes
              </p>
            </div>

          </div>
        </div>

        {/* Location & Vector Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
            <span className="text-[11px] text-[#51606f] block">Breach Vector / Classification</span>
            <span className="font-semibold text-[#191c20] mt-0.5 block">{record.breachType}</span>
          </div>
          <div className="p-3 bg-[#f2f4fa] rounded-2xl border border-[#e0e2e8]">
            <span className="text-[11px] text-[#51606f] block">Physical / Network Location</span>
            <span className="font-semibold text-[#191c20] mt-0.5 block">{record.location}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-[#e0e2e8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#51606f]">
            <FileText className="w-3.5 h-3.5" />
            <span>Recorded Date: {record.breachDate}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00639b] hover:bg-[#005180] text-white text-xs font-semibold rounded-full transition cursor-pointer shadow-xs"
          >
            Close Forensic Details
          </button>
        </div>

      </div>
    </div>
  );
};
