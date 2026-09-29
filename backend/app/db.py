import sqlite3
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from .config import DATABASE_PATH, DEFAULT_DATASET_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Breach Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS breach_records (
        id TEXT PRIMARY KEY,
        entity_name TEXT NOT NULL,
        state TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        individuals_affected INTEGER NOT NULL,
        breach_date TEXT NOT NULL,
        breach_type TEXT NOT NULL,
        location TEXT NOT NULL,
        detection_delay_days INTEGER NOT NULL DEFAULT 0,
        network_protocol TEXT NOT NULL DEFAULT 'HTTPS',
        packet_length_avg REAL NOT NULL DEFAULT 500.0,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        unusual_data_transfer_mb REAL NOT NULL DEFAULT 0.0,
        is_breach INTEGER NOT NULL DEFAULT 0,
        severity_level TEXT NOT NULL DEFAULT 'Low',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Zero Trust Policies Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zero_trust_policies (
        policy_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL,
        max_failed_logins INTEGER NOT NULL,
        max_transfer_mb REAL NOT NULL,
        mfa_required INTEGER NOT NULL DEFAULT 1,
        action_if_violated TEXT NOT NULL DEFAULT 'BLOCK',
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. SIEM Audit Logs Table (SHA-256 Hash Chained)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS siem_audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        facility TEXT NOT NULL,
        severity TEXT NOT NULL,
        cef_header TEXT NOT NULL,
        extension TEXT NOT NULL,
        sha256_hash TEXT NOT NULL,
        prev_hash TEXT NOT NULL
    );
    """)

    # 4. Model Registry Checkpoints Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_registry (
        version TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        model_type TEXT NOT NULL,
        accuracy REAL NOT NULL,
        f1_score REAL NOT NULL,
        roc_auc REAL NOT NULL,
        mia_risk_score REAL NOT NULL,
        epsilon REAL,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_date TEXT NOT NULL,
        sha256_checksum TEXT NOT NULL
    );
    """)

    # 5. Global Threat Intelligence Vectors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS threat_intel_vectors (
        ip_address TEXT PRIMARY KEY,
        country TEXT NOT NULL,
        threat_group TEXT NOT NULL,
        ransomware_family TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        last_active TEXT NOT NULL
    );
    """)

    # 6. Playbook Execution Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playbook_execution_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playbook_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_ip TEXT,
        details TEXT NOT NULL,
        executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Users Table for Zero Trust IAM & RBAC
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Security Officer',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Seed Default Users if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        def _h(pwd: str) -> str:
            h = 0
            for ch in pwd:
                h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
                if h >= 0x80000000:
                    h -= 0x100000000
            return f"sha_{abs(h):x}_sec"

        default_users = [
            ("USR-88210", "Dr. Emmanuel Security Officer", "officer@emmanuel.health", _h("Security2026!"), "Security Officer"),
            ("USR-88211", "Elena Vance (Auditor)", "auditor@emmanuel.health", _h("Auditor2026!"), "Compliance Auditor"),
            ("USR-88212", "Chief Security Officer", "admin@emmanuel.health", _h("AdminMaster2026!"), "Super Admin"),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO users (user_id, user_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            default_users
        )
        conn.commit()

    # Seed Breach Records if table is empty
    cursor.execute("SELECT COUNT(*) FROM breach_records")
    count = cursor.fetchone()[0]
    if count == 0 and DEFAULT_DATASET_PATH.exists():
        print(f"[Emmanuel DB] Seeding breach_records from {DEFAULT_DATASET_PATH}...")
        with open(DEFAULT_DATASET_PATH, "r", encoding="utf-8") as f:
            records = json.load(f)
            for r in records:
                cursor.execute("""
                INSERT OR IGNORE INTO breach_records (
                    id, entity_name, state, entity_type, individuals_affected,
                    breach_date, breach_type, location, detection_delay_days,
                    network_protocol, packet_length_avg, failed_login_attempts,
                    unusual_data_transfer_mb, is_breach, severity_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r.get("id"),
                    r.get("entityName", "Clinical Entity"),
                    r.get("state", "CA"),
                    r.get("entityType", "Healthcare Provider"),
                    int(r.get("individualsAffected", 0)),
                    str(r.get("breachDate", "2024-01-01")),
                    r.get("breachType", "Hacking/IT Incident"),
                    r.get("location", "Network Server"),
                    int(r.get("detectionDelayDays", 0)),
                    r.get("networkProtocol", "HTTPS"),
                    float(r.get("packetLengthAvg", 500.0)),
                    int(r.get("failedLoginAttempts", 0)),
                    float(r.get("unusualDataTransferMB", 0.0)),
                    int(r.get("isBreach", 0)),
                    r.get("severityLevel", "Low")
                ))
        conn.commit()
        cursor.execute("SELECT COUNT(*) FROM breach_records")
        print(f"[Emmanuel DB] Seeded {cursor.fetchone()[0]} breach records.")

    # Seed Default Zero Trust Policies if empty
    cursor.execute("SELECT COUNT(*) FROM zero_trust_policies")
    if cursor.fetchone()[0] == 0:
        default_policies = [
            ("ZTP-001", "RDP / SMB High-Risk Protocol Isolation", "SMB / RDP", 10, 5000.0, 1, "BLOCK", 1),
            ("ZTP-002", "EHR Patient Record Query Ceiling", "HL7/FHIR", 5, 1000.0, 1, "QUARANTINE", 1),
            ("ZTP-003", "DICOM Radiologic Image Transfer Ceiling", "DICOM", 15, 15000.0, 0, "FLAG", 1)
        ]
        cursor.executemany("""
        INSERT INTO zero_trust_policies (
            policy_id, name, protocol, max_failed_logins, max_transfer_mb,
            mfa_required, action_if_violated, is_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_policies)
        conn.commit()

    # Seed Default Threat Vectors if empty
    cursor.execute("SELECT COUNT(*) FROM threat_intel_vectors")
    if cursor.fetchone()[0] == 0:
        default_threats = [
            ("185.220.101.42", "Eastern Europe / Proxy Node", "LockBit 3.0 Ransomware Syndicate", "LockBit-Black", 98, "2 mins ago"),
            ("194.26.29.112", "Central Europe / Offshore VPS", "BlackCat / ALPHV Threat Group", "ALPHV-Rust", 95, "14 mins ago"),
            ("45.142.214.88", "Asia-Pacific / Tor Exit Node", "Clop Ransomware Campaign", "Clop-MOVEit Exploit", 92, "1 hour ago"),
            ("91.240.118.15", "South America / Bulletproof Hoster", "Akira Cyber Crime Unit", "Akira-Linux", 88, "3 hours ago")
        ]
        cursor.executemany("""
        INSERT INTO threat_intel_vectors (
            ip_address, country, threat_group, ransomware_family, risk_score, last_active
        ) VALUES (?, ?, ?, ?, ?, ?)
        """, default_threats)
        conn.commit()

    # Seed Model Registry if empty
    cursor.execute("SELECT COUNT(*) FROM model_registry")
    if cursor.fetchone()[0] == 0:
        default_models = [
            ("v2.4-DP", "Random Forest DP Ensemble", "Random Forest", 95.8, 96.2, 0.985, 44.5, 0.5, 1, "2026-09-24", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
            ("v2.0-Prod", "Random Forest Classifier", "Random Forest", 96.7, 97.3, 0.991, 58.0, 1.0, 0, "2026-09-20", "a7f3e1b980c4d2e1f5a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9"),
            ("v1.1-Stable", "Gradient Boosting Classifier", "Gradient Boosting", 93.3, 94.1, 0.965, 62.4, None, 0, "2026-09-15", "b8e4f2c091d5e2f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"),
            ("v1.0-Baseline", "Decision Tree Baseline", "Decision Tree", 83.3, 85.0, 0.880, 78.5, None, 0, "2026-09-01", "c9f5a3d102e6f3a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1")
        ]
        cursor.executemany("""
        INSERT INTO model_registry (
            version, model_name, model_type, accuracy, f1_score, roc_auc,
            mia_risk_score, epsilon, is_active, created_date, sha256_checksum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_models)
        conn.commit()

    # Seed Genesis SIEM Log with genuine SHA-256 Hash Chaining
    cursor.execute("SELECT COUNT(*) FROM siem_audit_logs")
    if cursor.fetchone()[0] == 0:
        prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        ts = datetime.utcnow().isoformat() + "Z"
        cef_header = "CEF:0|EmmanuelHealthcare|ZeroTrustIAM|1.0|SYS-INIT|Emmanuel Database and Cryptographic Audit Ledger Initialized|1"
        extension = "action=SYSTEM_INITIALIZED status=SUCCESS db=emmanuel.db"
        data_to_hash = f"{prev_hash}{ts}{cef_header}{extension}".encode("utf-8")
        genesis_hash = hashlib.sha256(data_to_hash).hexdigest()

        cursor.execute("""
        INSERT INTO siem_audit_logs (
            id, timestamp, facility, severity, cef_header, extension, sha256_hash, prev_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "SYS-0001",
            ts,
            "SECURITY",
            "INFO",
            cef_header,
            extension,
            genesis_hash,
            prev_hash
        ))
        conn.commit()

    conn.close()

# Database Query Helper Functions

def get_breach_records(limit: int = 50, offset: int = 0, search: Optional[str] = None, severity: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM breach_records WHERE 1=1"
    params = []

    if search:
        query += " AND (entity_name LIKE ? OR state LIKE ? OR breach_type LIKE ? OR location LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if severity and severity != 'ALL':
        query += " AND severity_level = ?"
        params.append(severity)

    query += " ORDER BY individuals_affected DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "entityName": r["entity_name"],
            "state": r["state"],
            "entityType": r["entity_type"],
            "individualsAffected": r["individuals_affected"],
            "breachDate": r["breach_date"],
            "breachType": r["breach_type"],
            "location": r["location"],
            "detectionDelayDays": r["detection_delay_days"],
            "networkProtocol": r["network_protocol"],
            "packetLengthAvg": r["packet_length_avg"],
            "failedLoginAttempts": r["failed_login_attempts"],
            "unusualDataTransferMB": r["unusual_data_transfer_mb"],
            "isBreach": r["is_breach"],
            "severityLevel": r["severity_level"]
        })
    conn.close()
    return results

def insert_breach_record(record: Dict[str, Any]) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO breach_records (
        id, entity_name, state, entity_type, individuals_affected,
        breach_date, breach_type, location, detection_delay_days,
        network_protocol, packet_length_avg, failed_login_attempts,
        unusual_data_transfer_mb, is_breach, severity_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["id"],
        record.get("entityName", "Clinical Entity"),
        record.get("state", "CA"),
        record.get("entityType", "Healthcare Provider"),
        int(record.get("individualsAffected", 0)),
        str(record.get("breachDate", datetime.utcnow().strftime("%Y-%m-%d"))),
        record.get("breachType", "Hacking/IT Incident"),
        record.get("location", "Network Server"),
        int(record.get("detectionDelayDays", 0)),
        record.get("networkProtocol", "HTTPS"),
        float(record.get("packetLengthAvg", 500.0)),
        int(record.get("failedLoginAttempts", 0)),
        float(record.get("unusualDataTransferMB", 0.0)),
        int(record.get("isBreach", 0)),
        record.get("severityLevel", "Low")
    ))
    conn.commit()
    conn.close()
    return True

def get_zero_trust_policies() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM zero_trust_policies ORDER BY policy_id ASC")
    rows = cursor.fetchall()
    policies = []
    for r in rows:
        policies.append({
            "policyID": r["policy_id"],
            "name": r["name"],
            "protocol": r["protocol"],
            "maxFailedLogins": r["max_failed_logins"],
            "maxTransferMB": r["max_transfer_mb"],
            "mfaRequired": bool(r["mfa_required"]),
            "actionIfViolated": r["action_if_violated"],
            "isEnabled": bool(r["is_enabled"])
        })
    conn.close()
    return policies

def save_zero_trust_policy(policy: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO zero_trust_policies (
        policy_id, name, protocol, max_failed_logins, max_transfer_mb,
        mfa_required, action_if_violated, is_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        policy["policyID"],
        policy["name"],
        policy["protocol"],
        int(policy["maxFailedLogins"]),
        float(policy["maxTransferMB"]),
        1 if policy.get("mfaRequired", True) else 0,
        policy.get("actionIfViolated", "BLOCK"),
        1 if policy.get("isEnabled", True) else 0
    ))
    conn.commit()
    conn.close()
    return policy

def delete_zero_trust_policy(policy_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM zero_trust_policies WHERE policy_id = ?", (policy_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def get_siem_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM siem_audit_logs ORDER BY rowid DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "facility": r["facility"],
            "severity": r["severity"],
            "cefHeader": r["cef_header"],
            "extension": r["extension"],
            "sha256Hash": r["sha256_hash"],
            "prevHash": r["prev_hash"]
        })
    conn.close()
    return logs

def append_siem_log(log_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT sha256_hash FROM siem_audit_logs ORDER BY rowid DESC LIMIT 1")
    row = cursor.fetchone()
    prev_hash = row[0] if row else "0000000000000000000000000000000000000000000000000000000000000000"

    ts = log_data.get("timestamp") or (datetime.utcnow().isoformat() + "Z")
    payload = log_data.get("cefHeader", "") + log_data.get("extension", "")
    to_hash = f"{prev_hash}{ts}{payload}".encode("utf-8")
    new_hash = hashlib.sha256(to_hash).hexdigest()

    log_id = log_data.get("id") or f"SYS-{datetime.utcnow().strftime('%H%M%S%f')[:10]}"
    cursor.execute("""
    INSERT INTO siem_audit_logs (
        id, timestamp, facility, severity, cef_header, extension, sha256_hash, prev_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        log_id,
        ts,
        log_data.get("facility", "SECURITY"),
        log_data.get("severity", "ALERT"),
        log_data.get("cefHeader", ""),
        log_data.get("extension", ""),
        new_hash,
        prev_hash
    ))
    conn.commit()
    conn.close()

    return {
        "id": log_id,
        "timestamp": ts,
        "facility": log_data.get("facility", "SECURITY"),
        "severity": log_data.get("severity", "ALERT"),
        "cefHeader": log_data.get("cefHeader", ""),
        "extension": log_data.get("extension", ""),
        "sha256Hash": new_hash,
        "prevHash": prev_hash
    }

def get_threat_intel_vectors() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM threat_intel_vectors ORDER BY risk_score DESC")
    rows = cursor.fetchall()
    threats = []
    for r in rows:
        threats.append({
            "ipAddress": r["ip_address"],
            "country": r["country"],
            "threatGroup": r["threat_group"],
            "ransomwareFamily": r["ransomware_family"],
            "riskScore": r["risk_score"],
            "lastActive": r["last_active"]
        })
    conn.close()
    return threats

def get_model_registry_checkpoints() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM model_registry ORDER BY created_date DESC")
    rows = cursor.fetchall()
    models = []
    for r in rows:
        models.append({
            "version": r["version"],
            "modelName": r["model_name"],
            "modelType": r["model_type"],
            "accuracy": r["accuracy"],
            "f1Score": r["f1_score"],
            "rocAuc": r["roc_auc"],
            "miaRiskScore": r["mia_risk_score"],
            "epsilon": r["epsilon"],
            "isActive": bool(r["is_active"]),
            "createdDate": r["created_date"],
            "sha256Checksum": r["sha256_checksum"]
        })
    conn.close()
    return models

def set_active_model_checkpoint(version: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE model_registry SET is_active = 0")
    cursor.execute("UPDATE model_registry SET is_active = 1 WHERE version = ?", (version,))
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated

def hash_user_password(password: str) -> str:
    h = 0
    for ch in password:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    return f"sha_{abs(h):x}_sec"

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "userID": row["user_id"],
            "userName": row["user_name"],
            "email": row["email"],
            "passwordHash": row["password_hash"],
            "role": row["role"],
            "createdAt": row["created_at"]
        }
    return None

def create_user_in_db(user_name: str, email: str, password: str, role: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    if cursor.fetchone():
        conn.close()
        return None

    import random
    user_id = f"USR-{random.randint(10000, 99999)}"
    pwd_hash = hash_user_password(password)

    cursor.execute("""
    INSERT INTO users (user_id, user_name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, user_name.strip(), email.strip().lower(), pwd_hash, role))
    conn.commit()
    conn.close()

    return {
        "userID": user_id,
        "userName": user_name.strip(),
        "email": email.strip().lower(),
        "role": role,
        "createdAt": datetime.now().isoformat()
    }

