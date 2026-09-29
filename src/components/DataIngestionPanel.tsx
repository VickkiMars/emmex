import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Sliders
} from 'lucide-react';
import type { 
  HealthcareBreachRecord, 
  MissingValueStrategy, 
  NormalizationStrategy 
} from '../types';

interface DataIngestionPanelProps {
  onIngestDataset: (
    records: HealthcareBreachRecord[], 
    missingStrat: MissingValueStrategy, 
    normStrat: NormalizationStrategy
  ) => Promise<void> | void;
  isBackendConnected?: boolean;
}

export const DataIngestionPanel: React.FC<DataIngestionPanelProps> = ({
  onIngestDataset,
  isBackendConnected = false
}) => {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [missingStrategy, setMissingStrategy] = useState<MissingValueStrategy>('median');
  const [normStrategy, setNormStrategy] = useState<NormalizationStrategy>('minmax');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      setStatusMessage(null);
    };
    reader.readAsText(file);
  };

  const parseAndIngest = async () => {
    setStatusMessage(null);
    if (!inputText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please upload a dataset file or paste CSV / JSON data.' });
      return;
    }

    setIsProcessing(true);
    try {
      let records: HealthcareBreachRecord[] = [];

      // Try JSON parsing
      if (inputText.trim().startsWith('[') || inputText.trim().startsWith('{')) {
        const parsed = JSON.parse(inputText);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV format
        const lines = inputText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one data record.');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        records = lines.slice(1).map((line, idx) => {
          const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, any> = {};
          headers.forEach((h, i) => {
            rowObj[h] = values[i];
          });

          return {
            id: rowObj.id || `INGEST-${idx + 1}`,
            entityName: rowObj.entityName || rowObj.entity_name || 'Uploaded Clinical System',
            state: rowObj.state || 'US',
            entityType: rowObj.entityType || rowObj.entity_type || 'Healthcare Provider',
            individualsAffected: parseInt(rowObj.individualsAffected || rowObj.individuals_affected || '1000', 10),
            breachDate: rowObj.breachDate || rowObj.breach_date || new Date().toISOString().split('T')[0],
            breachType: rowObj.breachType || rowObj.breach_type || 'Hacking/IT Incident',
            location: rowObj.location || 'Network Server',
            detectionDelayDays: parseInt(rowObj.detectionDelayDays || rowObj.detection_delay_days || '14', 10),
            networkProtocol: (rowObj.networkProtocol || rowObj.network_protocol || 'HTTPS') as any,
            packetLengthAvg: parseFloat(rowObj.packetLengthAvg || rowObj.packet_length_avg || '540'),
            failedLoginAttempts: parseInt(rowObj.failedLoginAttempts || rowObj.failed_login_attempts || '2', 10),
            unusualDataTransferMB: parseFloat(rowObj.unusualDataTransferMB || rowObj.unusual_data_transfer_mb || '25.0'),
            isBreach: (parseInt(rowObj.isBreach || rowObj.is_breach || '1', 10) === 1 ? 1 : 0) as (0 | 1),
            severityLevel: (rowObj.severityLevel || rowObj.severity_level || 'Medium') as any
          };
        });
      }

      if (records.length === 0) {
        throw new Error('No valid records found in the uploaded secondary dataset.');
      }

      await onIngestDataset(records, missingStrategy, normStrategy);
      setStatusMessage({ 
        type: 'success', 
        text: `Successfully ingested ${records.length} records. Preprocessed & retrained ML benchmark models!` 
      });
      setInputText('');
      setFileName(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to parse dataset. Please verify format.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e0e2e8] p-5 sm:p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e0e2e8] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#cee5ff] text-[#00639b] flex items-center justify-center shrink-0 shadow-xs">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c20]">Secondary Dataset Ingestion & Retraining</h3>
            <p className="text-xs text-[#51606f]">
              Upload secondary healthcare telemetry datasets (CSV or JSON) to trigger automated preprocessing and model retraining.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f2f4fa] text-[#51606f] border border-[#e0e2e8]">
          <Database className="w-3.5 h-3.5 text-[#00639b]" />
          <span>{isBackendConnected ? 'FastAPI Preprocessing Service' : 'Client In-Memory Pipeline'}</span>
        </div>
      </div>

      {/* Upload Zone / Text Area */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#191c20] block">
          Upload Dataset File or Paste CSV / JSON Content
        </label>
        
        <div className="relative border-2 border-dashed border-[#c2c7cf] hover:border-[#00639b] rounded-2xl p-4 transition-colors bg-[#f8f9ff]">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center space-y-1">
            <FileText className="w-6 h-6 text-[#51606f] mx-auto" />
            <div className="text-xs font-semibold text-[#191c20]">
              {fileName ? fileName : 'Click to select or drag and drop CSV / JSON'}
            </div>
            <p className="text-[11px] text-[#72777f]">
              Compatible with HHS OCR breach schemas and network telemetry logs
            </p>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Or paste JSON or CSV telemetry records directly here..."
          rows={3}
          className="w-full p-3 bg-[#f2f4fa] hover:bg-[#eceef4] focus:bg-white border border-[#c2c7cf]/50 focus:border-[#00639b] rounded-2xl text-xs font-mono text-[#191c20] placeholder-[#72777f] focus:outline-none transition-all shadow-inner resize-none"
        />
      </div>

      {/* Preprocessing Strategy Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f8f9ff] p-4 rounded-2xl border border-[#e0e2e8]">
        <div>
          <label className="text-xs font-semibold text-[#191c20] block mb-1.5 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#00639b]" />
            <span>Missing Value Strategy</span>
          </label>
          <select
            value={missingStrategy}
            onChange={(e) => setMissingStrategy(e.target.value as MissingValueStrategy)}
            className="w-full bg-white border border-[#c2c7cf]/60 rounded-xl px-3 py-2 text-xs font-medium text-[#191c20] focus:outline-none focus:border-[#00639b]"
          >
            <option value="median">Median Imputation (Numeric Skew Resistant)</option>
            <option value="mean">Mean Imputation (Standard Distribution)</option>
            <option value="mode">Mode Imputation (Frequent Categorical)</option>
            <option value="drop">Drop Incomplete Rows</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#191c20] block mb-1.5 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#00639b]" />
            <span>Feature Normalization</span>
          </label>
          <select
            value={normStrategy}
            onChange={(e) => setNormStrategy(e.target.value as NormalizationStrategy)}
            className="w-full bg-white border border-[#c2c7cf]/60 rounded-xl px-3 py-2 text-xs font-medium text-[#191c20] focus:outline-none focus:border-[#00639b]"
          >
            <option value="minmax">MinMax Scaling [0, 1] (Neural & Distance)</option>
            <option value="standard">Z-Score Standardization (Gaussian)</option>
            <option value="none">Raw Unscaled Tensors</option>
          </select>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-[#d1fae5] border-[#a7f3d0] text-[#065f46]'
            : 'bg-[#ffdad6] border-[#ffb4ab] text-[#ba1a1a]'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#065f46]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ba1a1a]" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex justify-end pt-1">
        <button
          onClick={parseAndIngest}
          disabled={isProcessing}
          className="px-6 py-2.5 bg-[#00639b] hover:bg-[#005180] disabled:opacity-50 text-white text-xs font-semibold rounded-full flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Processing & Retraining...' : 'Ingest & Retrain Models'}</span>
        </button>
      </div>

    </div>
  );
};
