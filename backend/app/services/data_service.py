import json
import random
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Any
from pathlib import Path

from ..config import DEFAULT_DATASET_PATH
from ..models.schemas import HealthcareBreachRecord, PreprocessingResponse

class DataService:
    def __init__(self, dataset_path: Path = DEFAULT_DATASET_PATH):
        self.dataset_path = dataset_path
        self._raw_records: List[Dict[str, Any]] = []
        self.load_dataset()

    def load_dataset(self) -> List[Dict[str, Any]]:
        if self.dataset_path.exists():
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                self._raw_records = json.load(f)
        else:
            self._raw_records = []
        return self._raw_records

    def get_raw_records(self) -> List[Dict[str, Any]]:
        if not self._raw_records:
            self.load_dataset()
        return self._raw_records

    def generate_augmented_records(self, count: int = 100) -> List[Dict[str, Any]]:
        """
        Generates realistic synthetic healthcare network telemetry records
        grounded in the authentic HHS distributions.
        """
        states = ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'TN', 'MO', 'MN', 'UT']
        entity_types = ['Healthcare Provider', 'Covered Entity', 'Business Associate', 'Health Plan']
        breach_types = [
            'Hacking/IT Incident',
            'Unauthorized Access/Disclosure',
            'Insider Misuse',
            'Theft',
            'Loss',
            'Improper Disposal'
        ]
        locations = [
            'Network Server',
            'Electronic Medical Record',
            'E-mail',
            'Desktop Computer',
            'Laptop',
            'Other Portable Electronic Device'
        ]
        protocols = ['HTTPS', 'SFTP', 'TCP/IP', 'RDP', 'SMB', 'DICOM', 'HL7/FHIR']

        synthetic = []
        for i in range(count):
            is_breach = 1 if random.random() < 0.65 else 0
            
            if is_breach:
                failed_logins = random.choice([random.randint(12, 120), random.randint(25, 200)])
                data_transfer = round(random.uniform(5000, 95000), 2)
                packet_len = round(random.uniform(850, 1600), 1)
                individuals = int(random.choice([random.randint(500, 50000), random.randint(100000, 5000000)]))
                delay = random.randint(3, 90)
                b_type = random.choice(['Hacking/IT Incident', 'Unauthorized Access/Disclosure', 'Insider Misuse'])
                loc = random.choice(['Network Server', 'Electronic Medical Record', 'E-mail'])
                proto = random.choice(['SMB', 'RDP', 'HTTPS', 'HL7/FHIR', 'SFTP'])
                sev = 'High' if (data_transfer > 20000 or failed_logins > 30) else 'Medium'
            else:
                failed_logins = random.randint(0, 3)
                data_transfer = round(random.uniform(10, 800), 2)
                packet_len = round(random.uniform(320, 750), 1)
                individuals = 0
                delay = 0
                b_type = 'Unauthorized Access/Disclosure'
                loc = random.choice(['Network Server', 'Electronic Medical Record', 'Desktop Computer'])
                proto = random.choice(['HTTPS', 'DICOM', 'HL7/FHIR', 'TCP/IP'])
                sev = 'Low'

            rec = {
                "id": f"SYN-2024-{i+1:04d}",
                "entityName": f"Clinical Health Node {random.randint(100, 999)} - {random.choice(states)} Region",
                "state": random.choice(states),
                "entityType": random.choice(entity_types),
                "individualsAffected": individuals,
                "breachDate": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                "breachType": b_type,
                "location": loc,
                "detectionDelayDays": delay,
                "networkProtocol": proto,
                "packetLengthAvg": packet_len,
                "failedLoginAttempts": failed_logins,
                "unusualDataTransferMB": data_transfer,
                "isBreach": is_breach,
                "severityLevel": sev
            }
            synthetic.append(rec)
        return synthetic

    def preprocess_dataset(
        self,
        missing_strategy: str = 'median',
        normalization_strategy: str = 'minmax',
        encode_categorical: bool = True,
        augmentation_count: int = 0
    ) -> Tuple[pd.DataFrame, PreprocessingResponse]:
        logs = []
        raw = self.get_raw_records().copy()
        logs.append(f"Loaded {len(raw)} base authentic HHS records.")

        if augmentation_count > 0:
            synth = self.generate_augmented_records(augmentation_count)
            raw.extend(synth)
            logs.append(f"Augmented dataset with {augmentation_count} synthetic clinical telemetry records. Total: {len(raw)}.")

        df = pd.DataFrame(raw)

        # 1. Deduplication
        initial_len = len(df)
        df = df.drop_duplicates(subset=['id']).copy()
        dups_removed = initial_len - len(df)
        if dups_removed > 0:
            logs.append(f"Removed {dups_removed} duplicate records.")

        # 2. Missing Value Imputation
        numeric_cols = [
            'individualsAffected', 'detectionDelayDays', 'packetLengthAvg',
            'failedLoginAttempts', 'unusualDataTransferMB'
        ]
        imputed_count = 0
        for col in numeric_cols:
            if col in df.columns:
                null_mask = df[col].isnull()
                n_nulls = null_mask.sum()
                if n_nulls > 0:
                    imputed_count += int(n_nulls)
                    if missing_strategy == 'median':
                        fill_val = df[col].median()
                    elif missing_strategy == 'mean':
                        fill_val = df[col].mean()
                    else:
                        fill_val = df[col].mode()[0] if not df[col].mode().empty else 0
                    df[col] = df[col].fillna(fill_val)

        logs.append(f"Imputed {imputed_count} missing values across numerical features using '{missing_strategy}'.")

        # 3. Normalization (numerical)
        if normalization_strategy == 'minmax':
            for col in numeric_cols:
                min_v = df[col].min()
                max_v = df[col].max()
                denom = (max_v - min_v) if max_v != min_v else 1.0
                df[f'{col}_scaled'] = (df[col] - min_v) / denom
            logs.append("MinMax scaling applied to numerical columns (0.0 to 1.0 range).")
        elif normalization_strategy == 'standard':
            for col in numeric_cols:
                mean_v = df[col].mean()
                std_v = df[col].std() if df[col].std() != 0 else 1.0
                df[f'{col}_scaled'] = (df[col] - mean_v) / std_v
            logs.append("Standard scaling (z-score) applied to numerical columns.")

        # 4. Categorical Encoding
        cat_cols = ['breachType', 'location', 'networkProtocol', 'entityType', 'state']
        if encode_categorical:
            for col in cat_cols:
                if col in df.columns:
                    # One-hot or frequency encoding; we preserve original + create encoded category codes
                    df[f'{col}_code'] = df[col].astype('category').cat.codes
            logs.append("Categorical feature encoding complete (breachType, location, networkProtocol, entityType, state).")

        # Sample output records for response
        sample_records = [
            HealthcareBreachRecord(**r) 
            for r in df.head(10).to_dict(orient='records')
        ]

        response = PreprocessingResponse(
            totalRecords=len(df),
            missingValuesImputed=imputed_count,
            duplicatesRemoved=dups_removed,
            featuresEncoded=cat_cols if encode_categorical else [],
            transformationLogs=logs,
            sampleCleanedRecords=sample_records
        )

        return df, response


data_service = DataService()
