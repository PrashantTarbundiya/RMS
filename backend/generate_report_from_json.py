"""
generate_report_from_json.py
Reads the existing evaluation_results.json and generates:
  - evaluation_report.md
  - evaluation_results.csv
without re-running any embeddings.
"""
import os, sys, json, csv as csvmod
import numpy as np

BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

OUT      = os.path.join(BACKEND_DIR, 'data', 'evaluation_results')
JSON_PATH = os.path.join(OUT, 'evaluation_results.json')
CHARTS   = os.path.join(OUT, 'charts')

print(f'Reading {JSON_PATH} ...')
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    results = json.load(f)

# ── detect active models ──
active = list(results.get('baseline', {}).keys())
print(f'Active models: {active}')

# ── Write CSV ──
csv_path = os.path.join(OUT, 'evaluation_results.csv')
rows = []
for section in ['resolution', 'angle', 'lighting', 'blur']:
    for m in active:
        for label, met in results.get(section, {}).get(m, {}).items():
            if isinstance(met, dict):
                rows.append({
                    'section': section, 'model': m, 'condition': label,
                    'accuracy': met.get('accuracy'), 'precision': met.get('precision'),
                    'recall': met.get('recall'), 'f1': met.get('f1'),
                    'FAR': met.get('FAR'), 'FRR': met.get('FRR'), 'EER': met.get('EER'),
                    'lat_p50': met.get('lat_p50'), 'lat_p95': met.get('lat_p95'),
                    'fps': met.get('fps'),
                    'avg_cpu': met.get('avg_cpu'), 'avg_ram': met.get('avg_ram')
                })

with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    w = csvmod.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
print(f'CSV -> {csv_path}  ({len(rows)} rows)')

# ── Now import gen_report from run_evaluation_v2 ──
from run_evaluation_v2 import (gen_report, RESOLUTION_CONDS, ANGLE_CONDS,
                                LIGHT_CONDS, BLUR_CONDS, THRESHOLD)
import platform, psutil

dataset_info = {
    'persons': 69, 'images': 3081,
    'min_imgs': 3, 'max_imgs': 530, 'mean_imgs': 44.6,
    'test_per_person': 3, 'test_total': 207
}
sys_info = {
    'cpu': platform.processor()[:60],
    'ram': round(psutil.virtual_memory().total / 1e9, 1),
    'gpu': 'NVIDIA GeForce GTX 1650 (4.3 GB)'
}

report_path = gen_report(results, CHARTS, OUT, dataset_info, sys_info, active)
print(f'Report -> {report_path}')
print('\nDONE.')
