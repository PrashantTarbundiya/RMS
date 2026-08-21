import os
import json
import csv
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc

def plot_bar_chart(title, xlabel, ylabel, x_labels, values_list, labels, output_path, colors=None):
    plt.figure(figsize=(10, 6))
    x = np.arange(len(x_labels))
    width = 0.8 / len(values_list)
    
    if colors is None:
        colors = ['#5E6AD2', '#27A644', '#A855F7']
        
    for i, (vals, label, color) in enumerate(zip(values_list, labels, colors)):
        plt.bar(x + i * width, vals, width, label=label, color=color, alpha=0.9)
        
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.xticks(x + width * (len(values_list)-1) / 2, x_labels, rotation=45 if len(x_labels) > 5 else 0)
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()

def plot_roc_curves(model_rocs, output_path):
    plt.figure(figsize=(8, 8))
    colors = ['#5E6AD2', '#27A644', '#A855F7']
    
    for (model, fpr, tpr, roc_auc), color in zip(model_rocs, colors):
        plt.plot(fpr, tpr, color=color, lw=2, label=f'{model} (AUC = {roc_auc:.4f})')
        
    plt.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate (FAR)')
    plt.ylabel('True Positive Rate (1 - FRR)')
    plt.title('Receiver Operating Characteristic (ROC)')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_far_frr(thresholds, far, frr, model_name, eer, eer_thresh, output_path):
    plt.figure(figsize=(10, 6))
    plt.plot(thresholds, far, label='FAR (False Accept)', color='#F87171', lw=2)
    plt.plot(thresholds, frr, label='FRR (False Reject)', color='#5E6AD2', lw=2)
    plt.axvline(x=eer_thresh, color='#A855F7', linestyle='--', label=f'EER Threshold ({eer_thresh:.3f})')
    plt.plot(eer_thresh, eer, 'ko', label=f'EER ({eer:.4f})')
    
    plt.title(f'FAR vs FRR - {model_name}')
    plt.xlabel('Cosine Similarity Threshold')
    plt.ylabel('Error Rate')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_heatmap(data, row_labels, col_labels, title, output_path, cmap="YlGnBu"):
    plt.figure(figsize=(10, 8))
    sns.heatmap(data, annot=True, fmt=".2f", cmap=cmap, xticklabels=col_labels, yticklabels=row_labels)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_radar_chart(categories, values_dict, title, output_path):
    import math
    N = len(categories)
    angles = [n / float(N) * 2 * math.pi for n in range(N)]
    angles += angles[:1]
    
    plt.figure(figsize=(8, 8))
    ax = plt.subplot(111, polar=True)
    
    ax.set_theta_offset(math.pi / 2)
    ax.set_theta_direction(-1)
    
    plt.xticks(angles[:-1], categories)
    ax.set_rlabel_position(0)
    plt.yticks([2, 4, 6, 8, 10], ["2", "4", "6", "8", "10"], color="grey", size=7)
    plt.ylim(0, 10)
    
    colors = ['#5E6AD2', '#27A644', '#A855F7']
    for (model, values), color in zip(values_dict.items(), colors):
        vals = values + values[:1]
        ax.plot(angles, vals, color=color, linewidth=2, linestyle='solid', label=model)
        ax.fill(angles, vals, color=color, alpha=0.1)
        
    plt.title(title, size=16, y=1.1)
    plt.legend(loc='upper right', bbox_to_anchor=(0.1, 0.1))
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def generate_report(results, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate Charts
    models = list(results['models'].keys())
    
    # 1. Inference Time Comparison
    plot_bar_chart(
        "Average Inference Time (ms)", 
        "Model", "Time (ms)", 
        models, 
        [[results['models'][m]['inference']['avg_time_ms'] for m in models]],
        ["Avg Inference Time"],
        os.path.join(output_dir, "inference_time.png")
    )
    
    # 2. Accuracy Comparison
    plot_bar_chart(
        "Overall Accuracy (%)", 
        "Model", "Accuracy (%)", 
        models, 
        [[results['models'][m]['accuracy']['overall_accuracy'] for m in models]],
        ["Accuracy"],
        os.path.join(output_dir, "accuracy_overall.png")
    )
    
    # 3. Model Size Comparison
    plot_bar_chart(
        "Model Size (MB)", 
        "Model", "Size (MB)", 
        models, 
        [[results['models'][m]['info']['size_mb'] for m in models]],
        ["Size (MB)"],
        os.path.join(output_dir, "model_size.png")
    )
    
    # 4. ROC Curves
    roc_data = []
    for m in models:
        fpr = results['models'][m]['security']['roc_fpr']
        tpr = results['models'][m]['security']['roc_tpr']
        auc_val = results['models'][m]['security']['auc']
        roc_data.append((m, fpr, tpr, auc_val))
    plot_roc_curves(roc_data, os.path.join(output_dir, "roc_curves.png"))
    
    # 5. Radar Chart for Edge Score
    edge_scores = {}
    categories = ['Accuracy', 'Speed', 'Memory', 'CPU', 'Edge Compat', 'Unknown Det']
    for m in models:
        scores = results['models'][m]['edge_score']
        edge_scores[m] = [
            scores['Accuracy'], scores['Speed'], scores['Memory Efficiency'],
            scores['CPU Friendliness'], scores['Edge Compatibility'], scores['Unknown Detection']
        ]
    plot_radar_chart(categories, edge_scores, "Edge Deployment Score", os.path.join(output_dir, "edge_radar.png"))
    
    # Write Markdown
    md_path = os.path.join(output_dir, "FINAL_THESIS_REPORT.md")
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# Comprehensive Face Recognition Benchmarking Suite\n\n")
        f.write("## 1. MODEL INFORMATION\n\n")
        f.write("| Model | Architecture | Embedding Size | Size (MB) | Parameters | CPU | GPU | ONNX | TensorRT | PyTorch | TensorFlow |\n")
        f.write("|-------|--------------|----------------|-----------|------------|-----|-----|------|----------|---------|------------|\n")
        for m in models:
            i = results['models'][m]['info']
            f.write(f"| {m} | {i['architecture']} | {i['embedding_size']} | {i['size_mb']} | {i['parameters']} | "
                    f"{'✅' if i['cpu_support'] else '❌'} | {'✅' if i['gpu_support'] else '❌'} | "
                    f"{'✅' if i['onnx_support'] else '❌'} | {'✅' if i['tensorrt_support'] else '❌'} | "
                    f"{'✅' if i['pytorch_support'] else '❌'} | {'✅' if i['tf_support'] else '❌'} |\n")
        
        f.write("\n## 2. TRAINING PERFORMANCE\n\n")
        f.write("| Model | Total Time (s) | Emb/Sec | Avg Time/Img (ms) | Peak RAM (GB) | Peak VRAM (GB) | CPU Util (%) | GPU Util (%) |\n")
        f.write("|-------|----------------|---------|-------------------|---------------|----------------|--------------|--------------|\n")
        for m in models:
            t = results['models'][m]['training']
            f.write(f"| {m} | {t['total_time_s']:.2f} | {t['images_per_second']:.1f} | {t['avg_time_per_image_ms']:.1f} | "
                    f"{t['peak_ram_gb']:.2f} | {t['peak_vram_gb']:.2f} | {t['cpu_util_percent']:.1f} | {t['gpu_util_percent']:.1f} |\n")
        
        f.write("\n## 3. INFERENCE PERFORMANCE\n\n")
        f.write("![Inference Time Comparison](./inference_time.png)\n\n")
        f.write("| Model | Avg Time (ms) | Min (ms) | Max (ms) | Median (ms) | P95 (ms) | P99 (ms) | FPS | CPU Util (%) | GPU Util (%) |\n")
        f.write("|-------|---------------|----------|----------|-------------|----------|----------|-----|--------------|--------------|\n")
        for m in models:
            i = results['models'][m]['inference']
            f.write(f"| {m} | {i['avg_time_ms']:.2f} | {i['min_time_ms']:.2f} | {i['max_time_ms']:.2f} | {i['median_time_ms']:.2f} | "
                    f"{i['p95_time_ms']:.2f} | {i['p99_time_ms']:.2f} | {i['fps']:.1f} | {i['cpu_util_percent']:.1f} | {i['gpu_util_percent']:.1f} |\n")
        
        f.write("\n## 4. ACCURACY METRICS\n\n")
        f.write("![Overall Accuracy](./accuracy_overall.png)\n\n")
        f.write("| Model | Overall Acc | Train Acc | Val Acc | Test Acc | Unknown Acc | Precision | Recall | F1 Score | Specificity | Balanced Acc | AUC |\n")
        f.write("|-------|-------------|-----------|---------|----------|-------------|-----------|--------|----------|-------------|--------------|-----|\n")
        for m in models:
            a = results['models'][m]['accuracy']
            sec = results['models'][m]['security']
            f.write(f"| {m} | {a['overall_accuracy']:.2f}% | {a['train_accuracy']:.2f}% | {a['val_accuracy']:.2f}% | {a['test_accuracy']:.2f}% | "
                    f"{a['unknown_accuracy']:.2f}% | {a['precision']:.4f} | {a['recall']:.4f} | {a['f1_score']:.4f} | {a['specificity']:.4f} | {a['balanced_accuracy']:.4f} | {sec['auc']:.4f} |\n")
        
        f.write("\n## 5. SECURITY METRICS\n\n")
        f.write("![ROC Curves](./roc_curves.png)\n\n")
        f.write("| Model | FAR (%) | FRR (%) | EER (%) | EER Threshold | Unknown Reject Rate | Known Detect Rate | Spoof Resistance |\n")
        f.write("|-------|---------|---------|---------|---------------|---------------------|-------------------|------------------|\n")
        for m in models:
            s = results['models'][m]['security']
            f.write(f"| {m} | {s['far']*100:.2f}% | {s['frr']*100:.2f}% | {s['eer']*100:.2f}% | {s['eer_threshold']:.3f} | "
                    f"{s['unknown_reject_rate']*100:.2f}% | {s['known_detect_rate']*100:.2f}% | {s.get('spoof_resistance', 'N/A')} |\n")
            
        f.write("\n## 6. ROBUSTNESS TESTS\n\n")
        f.write("| Condition | ")
        for m in models:
            f.write(f"{m} | ")
        f.write("\n|-----------|")
        for _ in models:
            f.write("-------|")
        f.write("\n")
        
        conditions = list(results['models'][models[0]]['robustness'].keys())
        for c in conditions:
            f.write(f"| {c} | ")
            for m in models:
                f.write(f"{results['models'][m]['robustness'][c]:.2f}% | ")
            f.write("\n")

        f.write("\n## 7. CAMERA BENCHMARK\n\n")
        f.write("| Spec | Accuracy |\n")
        f.write("|------|----------|\n")
        for spec, acc in results['camera'].items():
            f.write(f"| {spec} | {acc:.2f}% |\n")

        f.write("\n## 8. EDGE DEVICE COMPATIBILITY\n\n")
        f.write("| Device | Model | Expected FPS | Latency (ms) | RAM (MB) | Power (W) | Deployment | Overall |\n")
        f.write("|--------|-------|--------------|--------------|----------|-----------|------------|---------|\n")
        for dev, mdls in results['edge'].items():
            for m, dt in mdls.items():
                f.write(f"| {dev} | {m} | {dt['fps']:.1f} | {dt['latency_ms']:.1f} | {dt['ram_mb']} | {dt['power_w']} | {dt['difficulty']} | {dt['recommendation']} |\n")

        f.write("\n## 9. STORAGE REQUIREMENTS\n\n")
        f.write("| Metric | ")
        for m in models: f.write(f"{m} | ")
        f.write("\n|--------|")
        for _ in models: f.write("-------|")
        f.write("\n")
        metrics = list(results['models'][models[0]]['storage'].keys())
        for met in metrics:
            f.write(f"| {met} | ")
            for m in models: f.write(f"{results['models'][m]['storage'][met]} | ")
            f.write("\n")

        f.write("\n## 10. SCALABILITY\n\n")
        f.write("| Employees | ")
        for m in models: f.write(f"{m} Search Time (ms) | ")
        f.write("\n|-----------|")
        for _ in models: f.write("--------------------|")
        f.write("\n")
        scales = list(results['models'][models[0]]['scalability'].keys())
        for s in scales:
            f.write(f"| {s} | ")
            for m in models: f.write(f"{results['models'][m]['scalability'][s]:.2f} | ")
            f.write("\n")

        f.write("\n## 11. EDGE DEPLOYMENT SCORE\n\n")
        f.write("![Edge Deployment Radar](./edge_radar.png)\n\n")
        f.write("| Model | Accuracy | Speed | Memory | CPU | GPU | Edge | Cloud | Maintain | Deploy | Real-time | Unknown | Total |\n")
        f.write("|-------|----------|-------|--------|-----|-----|------|-------|----------|--------|-----------|---------|-------|\n")
        for m in models:
            e = results['models'][m]['edge_score']
            total = sum(e.values())
            f.write(f"| {m} | {e['Accuracy']} | {e['Speed']} | {e['Memory Efficiency']} | {e['CPU Friendliness']} | {e['GPU Friendliness']} | "
                    f"{e['Edge Compatibility']} | {e['Cloud Compatibility']} | {e['Maintainability']} | {e['Ease of Deployment']} | "
                    f"{e['Real-time Capability']} | {e['Unknown Detection']} | **{total}/110** |\n")

        f.write("\n## 12. FINAL COMPARISON TABLE\n\n")
        f.write("A synthesized view of all major metrics across models.\n\n")
        
        f.write("\n## 13. VISUALIZATIONS\n\n")
        f.write("Visualizations have been included inline in the sections above (Inference Time, Accuracy, ROC Curves, and Radar Chart). Refer to the `benchmark_output/` directory for full resolution assets.\n\n")

        f.write("\n## 14. FINAL ENGINEERING DECISION\n\n")
        d = results['final_decision']
        f.write(f"1. **Which model is the most accurate?** {d['most_accurate']}\n")
        f.write(f"2. **Which model is fastest?** {d['fastest']}\n")
        f.write(f"3. **Which model is smallest?** {d['smallest']}\n")
        f.write(f"4. **Which model is best for CPU-only deployment?** {d['cpu_best']}\n")
        f.write(f"5. **Which model is best for Raspberry Pi?** {d['rpi_best']}\n")
        f.write(f"6. **Which model is best for Jetson Nano?** {d['jetson_nano_best']}\n")
        f.write(f"7. **Which model is best for Jetson Orin?** {d['jetson_orin_best']}\n")
        f.write(f"8. **Which model is best for cloud deployment?** {d['cloud_best']}\n")
        f.write(f"9. **Which model gives the best balance between speed and accuracy?** {d['balance_best']}\n")
        f.write(f"10. **Which model should be used in this internship project?** {d['internship_choice']}\n")
        f.write(f"11. **Which model would you recommend for a real-world employee attendance/security system?** {d['realworld_choice']}\n")
        f.write(f"12. **Which model would you recommend for future production deployment?** {d['future_choice']}\n\n")
        f.write("### 13. Advantages and Disadvantages\n\n")
        for m in models:
            f.write(f"**{m}**\n- Advantages: {d['adv_dis'][m]['adv']}\n- Disadvantages: {d['adv_dis'][m]['dis']}\n\n")
        
        f.write("### 14. Recommended Improvements for Future Work\n")
        f.write("- " + "\n- ".join(d['future_improvements']) + "\n")

    # Export JSON
    with open(os.path.join(output_dir, 'benchmark_results.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4)
        
    # Export CSV summary
    csv_path = os.path.join(output_dir, 'benchmark_summary.csv')
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Model', 'Accuracy', 'Speed (ms)', 'Size (MB)', 'Edge Score'])
        for m in models:
            writer.writerow([
                m, 
                results['models'][m]['accuracy']['overall_accuracy'],
                results['models'][m]['inference']['avg_time_ms'],
                results['models'][m]['info']['size_mb'],
                sum(results['models'][m]['edge_score'].values())
            ])
            
    print(f"Report generated successfully at {md_path}")
