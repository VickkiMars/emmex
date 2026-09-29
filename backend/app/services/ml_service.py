import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

from ..config import MODELS_DIR
from ..models.schemas import (
    MLModelSummary,
    EvaluationMetrics,
    ConfusionMatrix,
    FeatureImportanceItem,
    FeatureSelectionResponse,
    MLModelType
)
from .data_service import data_service

FEATURE_COLUMNS = [
    'unusualDataTransferMB',
    'failedLoginAttempts',
    'individualsAffected',
    'packetLengthAvg',
    'detectionDelayDays',
    'breachType_code',
    'location_code',
    'networkProtocol_code'
]

FEATURE_DISPLAY_NAMES = {
    'unusualDataTransferMB': 'Unusual Data Transfer Volume (MB)',
    'failedLoginAttempts': 'Failed Login Attempts Count',
    'individualsAffected': 'Individuals Affected Count',
    'packetLengthAvg': 'Average Network Packet Length (Bytes)',
    'detectionDelayDays': 'Breach Detection Delay (Days)',
    'breachType_code': 'Breach Incident Category Code',
    'location_code': 'Location of Breached Infrastructure Code',
    'networkProtocol_code': 'Network Protocol Code'
}

class MLService:
    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.trained_models: Dict[str, Any] = {}
        self.model_summaries: Dict[str, MLModelSummary] = {}
        self.active_model_id: Optional[str] = None
        self.last_feature_importances: List[FeatureImportanceItem] = []
        self._initial_train_done = False

    def _prepare_training_data(self, df: Optional[pd.DataFrame] = None) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        if df is None:
            # We augment with 70 realistic synthetic samples to ensure robust train/test split size (100 total samples)
            df, _ = data_service.preprocess_dataset(augmentation_count=70)
        
        # Ensure codes exist
        for col in ['breachType', 'location', 'networkProtocol']:
            if f'{col}_code' not in df.columns and col in df.columns:
                df[f'{col}_code'] = df[col].astype('category').cat.codes
            elif f'{col}_code' not in df.columns:
                df[f'{col}_code'] = 0

        X = df[FEATURE_COLUMNS].fillna(0).values
        y = df['isBreach'].values
        return X, y, df

    def get_feature_importances(self) -> FeatureSelectionResponse:
        X, y, df = self._prepare_training_data()
        
        # Fit Random Forest to extract real Gini importances
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X, y)
        importances = rf.feature_importances_

        rankings = []
        for feat_name, imp in zip(FEATURE_COLUMNS, importances):
            # Calculate correlation with target
            corr = float(np.corrcoef(df[feat_name].fillna(0), df['isBreach'])[0, 1])
            if np.isnan(corr):
                corr = 0.0

            rankings.append(FeatureImportanceItem(
                featureName=feat_name,
                displayName=FEATURE_DISPLAY_NAMES.get(feat_name, feat_name),
                importanceScore=round(float(imp), 4),
                correlationWithTarget=round(abs(corr), 4),
                isSelected=True
            ))

        rankings.sort(key=lambda x: x.importanceScore, reverse=True)
        self.last_feature_importances = rankings

        return FeatureSelectionResponse(
            selectedFeatures=[r.featureName for r in rankings],
            featureRankings=rankings,
            topPredictor=rankings[0].displayName if rankings else "unusualDataTransferMB"
        )

    def train_all_models(
        self,
        test_size: float = 0.20,
        random_state: int = 42,
        use_dp: bool = False,
        epsilon_dp: float = 1.0
    ) -> List[MLModelSummary]:
        X, y, _ = self._prepare_training_data()
        
        # Add differential privacy noise to features if requested
        if use_dp:
            scale = 1.0 / max(0.01, epsilon_dp)
            noise = np.random.laplace(0, scale, X.shape)
            X = np.clip(X + noise, 0, None)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        model_factories = {
            'Random Forest': (
                RandomForestClassifier(n_estimators=100, max_depth=12, criterion='gini', random_state=random_state),
                {'n_estimators': 100, 'max_depth': 12, 'criterion': 'gini', 'random_state': random_state}
            ),
            'Gradient Boosting': (
                GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=random_state),
                {'n_estimators': 100, 'learning_rate': 0.1, 'max_depth': 4}
            ),
            'Support Vector Machine': (
                SVC(probability=True, kernel='rbf', C=1.0, random_state=random_state),
                {'kernel': 'rbf', 'C': 1.0, 'probability': True}
            ),
            'K-Nearest Neighbors': (
                KNeighborsClassifier(n_neighbors=5, metric='minkowski'),
                {'n_neighbors': 5, 'metric': 'minkowski'}
            ),
            'Decision Tree': (
                DecisionTreeClassifier(max_depth=10, criterion='gini', random_state=random_state),
                {'max_depth': 10, 'criterion': 'gini'}
            )
        }

        summaries = []
        best_f1 = -1.0
        best_id = ""

        for model_type, (clf, hyperparams) in model_factories.items():
            start_t = time.perf_counter()
            clf.fit(X_train, y_train)
            train_time = round((time.perf_counter() - start_t) * 1000, 2)

            y_train_pred = clf.predict(X_train)
            y_test_pred = clf.predict(X_test)
            
            # Predict probabilities for ROC-AUC
            if hasattr(clf, "predict_proba"):
                y_test_probs = clf.predict_proba(X_test)[:, 1]
            else:
                y_test_probs = y_test_pred

            train_acc = round(float(accuracy_score(y_train, y_train_pred) * 100), 1)
            test_acc = round(float(accuracy_score(y_test, y_test_pred) * 100), 1)
            precision = round(float(precision_score(y_test, y_test_pred, zero_division=0) * 100), 1)
            recall = round(float(recall_score(y_test, y_test_pred, zero_division=0) * 100), 1)
            f1 = round(float(f1_score(y_test, y_test_pred, zero_division=0) * 100), 1)
            
            try:
                roc_auc = round(float(roc_auc_score(y_test, y_test_probs) * 100), 1)
            except Exception:
                roc_auc = test_acc

            cm = confusion_matrix(y_test, y_test_pred)
            if cm.shape == (2, 2):
                tn, fp, fn, tp = cm.ravel()
            else:
                tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0

            metrics = EvaluationMetrics(
                accuracy=test_acc,
                precision=precision,
                recall=recall,
                f1Score=f1,
                confusionMatrix=ConfusionMatrix(tp=int(tp), fp=int(fp), tn=int(tn), fn=int(fn)),
                rocAuc=roc_auc,
                trainingTimeMs=train_time
            )

            model_id = f"MDL-{model_type.upper().replace(' ', '_')}"
            summary = MLModelSummary(
                modelID=model_id,
                modelName=f"{model_type} Security Classifier",
                modelType=model_type,
                trainingAccuracy=train_acc,
                testingAccuracy=test_acc,
                metrics=metrics,
                hyperparameters=hyperparams,
                isTrained=True,
                isPersisted=True,
                activeStatus=False,
                epsilonDP=epsilon_dp if use_dp else None
            )

            # Persist model
            save_path = self.models_dir / f"{model_id}.joblib"
            joblib.dump(clf, save_path)
            self.trained_models[model_id] = clf
            self.model_summaries[model_id] = summary
            summaries.append(summary)

            if f1 > best_f1:
                best_f1 = f1
                best_id = model_id

        # Set default active model
        if best_id:
            self.active_model_id = best_id
            for s in summaries:
                if s.modelID == best_id:
                    s.activeStatus = True

        self._initial_train_done = True
        return summaries

    def get_model(self, model_id: Optional[str] = None):
        if not self._initial_train_done or not self.trained_models:
            self.train_all_models()

        target_id = model_id or self.active_model_id
        if target_id not in self.trained_models:
            # Try loading from disk
            save_path = self.models_dir / f"{target_id}.joblib"
            if save_path.exists():
                self.trained_models[target_id] = joblib.load(save_path)
            else:
                # Return first available
                target_id = next(iter(self.trained_models.keys()), None)

        return self.trained_models.get(target_id), target_id

    def set_active_model(self, model_id: str) -> bool:
        if model_id in self.model_summaries:
            for s in self.model_summaries.values():
                s.activeStatus = (s.modelID == model_id)
            self.active_model_id = model_id
            return True
        return False


ml_service = MLService()
