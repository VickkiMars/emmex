import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import type { 
  MLModelSummary, 
  FeatureImportance, 
  HealthcareBreachRecord,
  MissingValueStrategy,
  NormalizationStrategy
} from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { DataIngestionPanel } from './DataIngestionPanel';

interface ModelEvaluationViewProps {
  models: MLModelSummary[];
  activeModel: MLModelSummary;
  features: FeatureImportance[];
  onSelectActiveModel: (model: MLModelSummary) => void;
  onRetrainModels: () => Promise<void> | void;
  onIngestDataset: (
    records: HealthcareBreachRecord[], 
    missingStrat: MissingValueStrategy, 
    normStrat: NormalizationStrategy
  ) => Promise<void> | void;
  isBackendConnected?: boolean;
}

export const ModelEvaluationView: React.FC<ModelEvaluationViewProps> = ({
  models,
  activeModel,
  features,
  onSelectActiveModel,
  onRetrainModels,
  onIngestDataset,
  isBackendConnected = false
}) => {
  const [isRetraining, setIsRetraining] = useState(false);

  // Model performance benchmark comparison data
  const performanceData = models.map(m => ({
    name: m.modelName.replace('Classifier', '').trim(),
    Accuracy: m.metrics.accuracy,
    Precision: m.metrics.precision,
    Recall: m.metrics.recall,
    'F1 Score': m.metrics.f1Score,
    isActive: m.modelID === activeModel.modelID
  }));

  // Top selected features sorted by importance score
  const sortedFeatures = [...features]
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 8);

  const featureChartData = sortedFeatures.map(f => ({
    name: f.displayName,
    importance: Math.round(f.importanceScore * 100)
  }));

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      await onRetrainModels();
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#e0e2e8] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#cee5ff]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cee5ff] text-[#001d33] rounded-full text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-[#00639b]" />
              <span>Model Training, Evaluation & Feature Selection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c20] tracking-tight">
              Machine Learning Model Evaluation
            </h1>
            <p className="text-xs sm:text-sm text-[#51606f] max-w-2xl font-normal leading-relaxed">
              Empirical evaluation across 5 benchmarked healthcare cybersecurity classifiers. Evaluates Accuracy, Precision, Recall, and F1 Score alongside Gini impurity feature ranking.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="px-5 py-2.5 bg-[#00639b] hover:bg-[#005180] disabled:opacity-50 text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining Models...' : 'Retrain All Models'}</span>
          </button>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {models.map(m => {
          const isSelected = m.modelID === activeModel.modelID;
          return (
            <button
              key={m.modelID}
              onClick={() => onSelectActiveModel(m)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#00639b] shadow-md ring-2 ring-[#00639b]/20'
                  : 'bg-white border-[#e0e2e8] hover:bg-[#f8f9ff]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#191c20] truncate">{m.modelName}</span>
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00639b] shrink-0" />
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-lg font-black text-[#00639b]">{m.metrics.accuracy}%</span>
                <span className="text-[10px] text-[#51606f]">Accuracy</span>
              </div>
              <div className="text-[10px] text-[#51606f] mt-0.5">
                F1: <strong className="text-[#191c20]">{m.metrics.f1Score}%</strong> • Train: {m.metrics.trainingTimeMs}ms
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual Representation of Performance Metrics (BarChart) */}
      <div className="bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#191c20]">Benchmark Model Performance Comparison</h2>
            <p className="text-xs text-[#51606f]">Accuracy, Precision, Recall, and F1 Score across all 5 evaluated classifiers</p>
          </div>
          <div className="text-xs text-[#51606f] hidden sm:block">
            Active: <strong className="text-[#00639b]">{activeModel.modelName}</strong>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#72777f" fontSize={11} tickLine={false} />
              <YAxis stroke="#72777f" fontSize={11} tickLine={false} domain={[50, 100]} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e2e8', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#00639b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#006c4c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#825500" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1 Score" fill="#51606f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Model Confusion Matrix & Feature Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Confusion Matrix Card */}
        <div className="bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#191c20]">Confusion Matrix</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#cee5ff] text-[#001d33]">
                {activeModel.modelName}
              </span>
            </div>
            <p className="text-xs text-[#51606f]">Classification outcomes on validation test split</p>

            <div className="grid grid-cols-2 gap-3 mt-6 text-center">
              <div className="p-4 bg-[#d6f5e7] border border-[#a1e3c8] rounded-2xl">
                <span className="text-[10px] font-bold text-[#006c4c] uppercase tracking-wider block">TRUE POSITIVE</span>
                <span className="text-2xl font-black text-[#002114] mt-1 block">
                  {activeModel.metrics.confusionMatrix.tp}
                </span>
                <span className="text-[10px] text-[#006c4c]">Breaches Blocked</span>
              </div>

              <div className="p-4 bg-[#ffdad6] border border-[#ffb4ab] rounded-2xl">
                <span className="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-wider block">FALSE POSITIVE</span>
                <span className="text-2xl font-black text-[#410002] mt-1 block">
                  {activeModel.metrics.confusionMatrix.fp}
                </span>
                <span className="text-[10px] text-[#ba1a1a]">False Alarms</span>
              </div>

              <div className="p-4 bg-[#ffddb8] border border-[#ffdcc0] rounded-2xl">
                <span className="text-[10px] font-bold text-[#825500] uppercase tracking-wider block">FALSE NEGATIVE</span>
                <span className="text-2xl font-black text-[#2b1700] mt-1 block">
                  {activeModel.metrics.confusionMatrix.fn}
                </span>
                <span className="text-[10px] text-[#825500]">Missed Breaches</span>
              </div>

              <div className="p-4 bg-[#cee5ff] border border-[#9ecaff] rounded-2xl">
                <span className="text-[10px] font-bold text-[#00639b] uppercase tracking-wider block">TRUE NEGATIVE</span>
                <span className="text-2xl font-black text-[#001d33] mt-1 block">
                  {activeModel.metrics.confusionMatrix.tn}
                </span>
                <span className="text-[10px] text-[#00639b]">Normal Allowed</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f8f9ff] p-3 rounded-2xl border border-[#e0e2e8] text-[11px] text-[#51606f] leading-relaxed">
            Training Time: <strong className="text-[#191c20]">{activeModel.metrics.trainingTimeMs}ms</strong> • AUC-ROC: <strong className="text-[#191c20]">{activeModel.metrics.rocAuc}%</strong>
          </div>
        </div>

        {/* Top Selected Features BarChart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e0e2e8] p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-[#191c20]">Top Selected Features (Gini Importance)</h2>
            <p className="text-xs text-[#51606f]">Variables with strongest correlation and predictive contribution to breach severity</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" stroke="#72777f" fontSize={11} tickLine={false} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#72777f" fontSize={11} width={130} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e0e2e8', fontSize: '11px' }}
                />
                <Bar dataKey="importance" fill="#00639b" radius={[0, 8, 8, 0]}>
                  {featureChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index < 2 ? '#ba1a1a' : index < 4 ? '#00639b' : '#51606f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Embedded DataIngestionPanel Component */}
      <DataIngestionPanel
        onIngestDataset={onIngestDataset}
        isBackendConnected={isBackendConnected}
      />

    </div>
  );
};
