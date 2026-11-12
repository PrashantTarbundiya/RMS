"""
Enterprise JSON Report Generator — AuraPass™ Enterprise
Generates Schema v2.0 verifiable JSON export payloads with deterministic SHA256 checksums.
"""

import json
import hashlib
from datetime import datetime, date


class EnterpriseJSONEncoder(json.JSONEncoder):
    """Encodes dates, datetimes, and custom objects safely."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return super().default(obj)


def generate_json_report(report_data):
    """
    Produces standardized, deterministic Schema v2.0 JSON report bytes.
    Computes a cryptographic SHA256 hash of the canonical dataset for audit verification.
    """
    # Clone to avoid mutating original
    payload = json.loads(json.dumps(report_data, cls=EnterpriseJSONEncoder))

    # Calculate deterministic payload SHA256 for genuine tamper-evident auditing
    canonical_repr = json.dumps(payload, sort_keys=True, cls=EnterpriseJSONEncoder).encode('utf-8')
    content_hash = hashlib.sha256(canonical_repr).hexdigest()

    if 'metadata' in payload:
        payload['metadata']['schema_version'] = "2.0"
        payload['metadata']['integrity_checksum_sha256'] = content_hash
        payload['metadata']['engine'] = "AuraPass™ Enterprise Canonical Export Engine"

    formatted_json_str = json.dumps(payload, indent=2, ensure_ascii=False)
    return formatted_json_str.encode('utf-8')

