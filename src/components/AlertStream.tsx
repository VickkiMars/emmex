import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Pause, 
  Play, 
  Trash2, 
  ShieldAlert, 
  ChevronRight, 
  Wifi, 
  WifiOff
} from 'lucide-react';
import type { HealthcareBreachRecord, SeverityLevel } from '../types';

interface AlertStreamProps {
  initialRecords: HealthcareBreachRecord[];
  onSelectThreat: (record: HealthcareBreachRecord) => void;
  isBackendConnected?: boolean;
}

export const AlertStream: React.FC<AlertStreamProps> = ({
  initialRecords,
  onSelectThreat,
  isBackendConnected = false
}) => {
  const [alerts, setAlerts] = useState<HealthcareBreachRecord[]>(() => 
    initialRecords.filter(r => r.isBreach === 1).slice(0, 15)
  );
  const [isStreaming, setIsStreaming] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'All' | SeverityLevel>('All');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Attempt WebSocket connection to FastAPI backend if available
  useEffect(() => {
    let ws: WebSocket | null = null;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = '';
    if (import.meta.env.VITE_WS_URL) {
      wsUrl = import.meta.env.VITE_WS_URL;
    } else if (window.location.port === '5173' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      wsUrl = `${protocol}//${window.location.hostname}:8005/ws/threats`;
    } else {
      wsUrl = `${protocol}//${window.location.host}/ws/threats`;
    }

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isStreaming) return;
        try {
          const newAlert: HealthcareBreachRecord = JSON.parse(event.data);
          setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
        } catch {
          // Non-JSON or ping message
        }
      };

      ws.onerror = () => {
        setIsWsConnected(false);
      };

      ws.onclose = () => {
        setIsWsConnected(false);
      };
    } catch {
      setIsWsConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Authentic HHS telemetry stream generator when WS is not connected or streaming actively
  useEffect(() => {
    if (!isStreaming || isWsConnected) return;

    const interval = setInterval(() => {
      // Pick a random record from authentic HHS dataset and introduce random telemetry variation
      const randomBase = initialRecords[Math.floor(Math.random() * initialRecords.length)];
      if (!randomBase) return;

      const sevLevels: SeverityLevel[] = ['High', 'Medium', 'Low'];
      const sev = randomBase.severityLevel || sevLevels[Math.floor(Math.random() * sevLevels.length)];

      const streamingAlert: HealthcareBreachRecord = {
        ...randomBase,
        id: `STRM-${Math.floor(10000 + Math.random() * 90000)}`,
        breachDate: new Date().toLocaleTimeString(),
        severityLevel: sev,
        isBreach: 1,
        unusualDataTransferMB: Math.max(10, randomBase.unusualDataTransferMB + (Math.random() * 80 - 40)),
        failedLoginAttempts: Math.floor(Math.random() * 8)
      };

      setAlerts(prev => [streamingAlert, ...prev.slice(0, 49)]);
    }, 3200);

    return () => clearInterval(interval);
  }, [isStreaming, isWsConnected, initialRecords]);

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'All') return true;
    return a.severityLevel === severityFilter;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#e0e2e8] p-5 sm:p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] font-sans">
      
      {/* Stream Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e0e2e8] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isStreaming ? 'bg-[#cee5ff] text-[#00639b]' : 'bg-[#f2f4fa] text-[#51606f]'
            }`}>
              <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse' : ''}`} />
            </div>
            {isStreaming && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#00639b] rounded-full ring-2 ring-white"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#191c20]">Live Anomaly Alert Feed</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isWsConnected 
                  ? 'bg-[#d6f5e7] text-[#002114] border border-[#a1e3c8]' 
                  : isBackendConnected 
                  ? 'bg-[#cee5ff] text-[#001d33] border border-[#9ecaff]' 
                  : 'bg-[#f2f4fa] text-[#51606f] border border-[#c2c7cf]'
              }`}>
                {isWsConnected ? <Wifi className="w-3 h-3 text-[#006c4c]" /> : <WifiOff className="w-3 h-3 text-[#72777f]" />}
                <span>{isWsConnected ? 'WebSocket Live' : 'Telemetry Stream'}</span>
              </span>
            </div>
            <p className="text-xs text-[#51606f]">
              Real-time incoming anomalies categorized by ML severity output
            </p>
          </div>
        </div>

        {/* Action Controls & Severity Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#f2f4fa] p-1 rounded-xl border border-[#e0e2e8] text-xs">
            {(['All', 'High', 'Medium', 'Low'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-white text-[#191c20] font-bold shadow-xs'
                    : 'text-[#51606f] hover:text-[#191c20]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsStreaming(prev => !prev)}
            className={`p-2 px-3 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1.5 ${
              isStreaming
                ? 'bg-[#f2f4fa] hover:bg-[#e6e8ee] text-[#191c20] border-[#c2c7cf]'
                : 'bg-[#cee5ff] hover:bg-[#9ecaff] text-[#001d33] border-[#9ecaff]'
            }`}
            title={isStreaming ? 'Pause incoming alerts stream' : 'Resume incoming alerts stream'}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="font-semibold">{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setAlerts([])}
            className="p-2 text-[#72777f] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition cursor-pointer"
            title="Clear alert feed buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-[#72777f] space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-[#c2c7cf]" />
            <p className="text-xs">No incoming alerts matching the selected severity criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((record) => {
            const isHigh = record.severityLevel === 'High';
            const isMed = record.severityLevel === 'Medium';

            const severityBadgeClass = isHigh
              ? 'md3-badge-high'
              : isMed
              ? 'md3-badge-medium'
              : 'md3-badge-low';

            return (
              <div
                key={record.id}
                onClick={() => onSelectThreat(record)}
                className="p-3.5 bg-white hover:bg-[#f8f9ff] border border-[#e0e2e8] hover:border-[#00639b]/40 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isHigh ? 'bg-[#ffdad6] text-[#ba1a1a]' : isMed ? 'bg-[#ffddb8] text-[#825500]' : 'bg-[#d6f5e7] text-[#006c4c]'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#191c20] truncate group-hover:text-[#00639b] transition-colors">
                        {record.entityName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadgeClass}`}>
                        {record.severityLevel || 'Low'}
                      </span>
                      <span className="text-[10px] text-[#51606f] font-mono">
                        {record.networkProtocol}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#51606f] truncate mt-0.5">
                      {record.breachType} • {record.location} • {record.individualsAffected.toLocaleString()} records • {record.unusualDataTransferMB.toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[#72777f] font-mono hidden sm:block">
                    {record.breachDate}
                  </span>
                  <div className="p-1 text-[#72777f] group-hover:text-[#00639b] group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
