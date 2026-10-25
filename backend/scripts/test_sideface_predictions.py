import os
import requests
import base64
import json

def test_predictions(base_url="http://127.0.0.1:5000"):
    url = f"{base_url}/api/predict"
    dataset_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dataset_cleaned")

    print(f"\n--- Testing API at: {url} ---")
    members = [
        "shivam_petkar", "vatsal_vadgama", "prashant_tarbundiya",
        "Dhruvik_Parmar", "Manan_Solanki", "Shiven_Vamja", 
        "Rakshit_gajnotar", "Ukani_Prince"
    ]
    for member in members:
        m_dir = os.path.join(dataset_dir, member)
        if not os.path.exists(m_dir):
            continue
        for root, dirs, files in os.walk(m_dir):
            for f in files:
                if not f.lower().endswith(('.jpg', '.png', '.jpeg')):
                    continue
                path = os.path.join(root, f)
                try:
                    with open(path, "rb") as img_f:
                        res = requests.post(
                            url, 
                            files={"image": (os.path.basename(path), img_f, "image/jpeg")}, 
                            data={"kiosk_mode": "true", "focus_single": "true"}, 
                            timeout=15
                        )
                    if res.status_code == 200:
                        data = res.json()
                        faces = data.get("faces", [])
                        for face in faces:
                            ens = face.get("ensemble", {})
                            name = ens.get("candidate_name") or ens.get("label") or face.get("name")
                            conf = ens.get("confidence") or face.get("confidence")
                            conf_str = f"{conf * 100:.1f}%" if conf is not None else "N/A"
                            confirmed = ens.get("is_confirmed", False)
                            level = ens.get("confidence_level", "unknown")
                            rel_p = os.path.relpath(path, m_dir)
                            print(f"[{member:18}] Image: {rel_p:25} -> Pred: {str(name):18} | Conf: {conf_str:6} | Level: {str(level):10} | Confirmed: {confirmed}", flush=True)
                except Exception as e:
                    print(f"[{member}] Error: {e}", flush=True)
    # Impostor / Negative control test
    print("\n--- Negative Control / Impostor Test ---", flush=True)
    celeb_dir = os.path.join(dataset_dir, "David_Beckham")
    if os.path.exists(celeb_dir):
        for f in os.listdir(celeb_dir):
            if f.lower().endswith(('.jpg', '.png', '.jpeg')):
                p = os.path.join(celeb_dir, f)
                with open(p, "rb") as img_f:
                    res = requests.post(
                        url, 
                        files={"image": (f, img_f, "image/jpeg")}, 
                        data={"kiosk_mode": "true", "focus_single": "true"}, 
                        timeout=15
                    )
                if res.status_code == 200:
                    for face in res.json().get("faces", []):
                        ens = face.get("ensemble", {})
                        pred_name = ens.get("candidate_name") or ens.get("label")
                        conf = ens.get("confidence")
                        print(f"[IMPOSTOR TEST] David Beckham ({f}) -> Pred: {pred_name} | Conf: {conf*100 if conf else 0:.1f}% | Confirmed: {ens.get('is_confirmed')}", flush=True)
                break

if __name__ == "__main__":
    test_predictions()
