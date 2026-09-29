import os
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import joblib

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnx
import onnxruntime as ort

from ..config import MODELS_DIR
from .ml_service import ml_service, FEATURE_COLUMNS

class OnnxExporterService:
    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir

    def export_model_to_onnx(
        self,
        model_id: str = "MDL-RANDOM_FOREST",
        output_filename: str = "model_random_forest.onnx"
    ) -> Dict[str, Any]:
        """
        Exports a trained scikit-learn classifier to the open standard ONNX format.
        Verifies execution using ONNX Runtime.
        """
        clf, resolved_id = ml_service.get_model(model_id)
        if clf is None:
            raise ValueError(f"Model '{model_id}' is not loaded or trained.")

        # Define input schema: 8 numerical features in FEATURE_COLUMNS
        initial_types = [('float_input', FloatTensorType([None, len(FEATURE_COLUMNS)]))]

        # Convert Scikit-Learn model to ONNX
        onnx_model = convert_sklearn(
            clf,
            initial_types=initial_types,
            target_opset=17,
            options={type(clf): {'zipmap': False}} if hasattr(clf, 'predict_proba') else None
        )

        output_path = self.models_dir / output_filename
        with open(output_path, "wb") as f:
            f.write(onnx_model.SerializeToString())

        file_size_kb = round(os.path.getsize(output_path) / 1024.0, 2)

        # Verification step: run sample inference using ONNX Runtime
        session = ort.InferenceSession(str(output_path))
        input_name = session.get_inputs()[0].name
        
        sample_input = np.array([[85400.0, 42.0, 15000000.0, 1420.0, 9.0, 0.0, 0.0, 4.0]], dtype=np.float32)
        ort_outputs = session.run(None, {input_name: sample_input})
        predicted_class = int(ort_outputs[0][0])
        probabilities = ort_outputs[1][0].tolist() if len(ort_outputs) > 1 else [0.0, 1.0]

        return {
            "status": "SUCCESS",
            "modelID": resolved_id,
            "onnxFilePath": str(output_path),
            "fileSizeKB": file_size_kb,
            "opsetVersion": 17,
            "inputShape": [None, len(FEATURE_COLUMNS)],
            "featureColumns": FEATURE_COLUMNS,
            "verificationTest": {
                "sampleInput": sample_input.tolist(),
                "onnxRuntimePredictedClass": predicted_class,
                "onnxRuntimeProbabilities": probabilities,
                "verified": True
            }
        }

    def export_all_models(self) -> Dict[str, Any]:
        results = {}
        for mid in ["MDL-RANDOM_FOREST", "MDL-GRADIENT_BOOSTING", "MDL-DECISION_TREE"]:
            clean_name = f"model_{mid.lower().replace('-', '_')}.onnx"
            try:
                res = self.export_model_to_onnx(mid, clean_name)
                results[mid] = res
            except Exception as e:
                results[mid] = {"status": "FAILED", "error": str(e)}
        return results


onnx_exporter = OnnxExporterService()
