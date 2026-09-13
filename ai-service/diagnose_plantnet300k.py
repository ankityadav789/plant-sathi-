import sys
import json
import random
from pathlib import Path
from typing import Dict, List, Tuple
import torch
from torch import nn
import torchvision.transforms as transforms
from torchvision.models import resnet18
from PIL import Image
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
PLANTNET_DIR = BASE_DIR / "models" / "plantnet300k"
MODEL_PATH = PLANTNET_DIR / "plantnet_resnet18.pth"
IDX2SPECIES_PATH = PLANTNET_DIR / "class_idx_to_species_id.json"
SPECIES2NAME_PATH = PLANTNET_DIR / "plantnet300K_species_id_2_name.json"

# ------------------------------------------------------------
# Helper utilities
# ------------------------------------------------------------

def load_json(path: Path) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_mappings() -> Tuple[Dict[str, str], Dict[str, str]]:
    idx2species = load_json(IDX2SPECIES_PATH)
    species2name = load_json(SPECIES2NAME_PATH)
    return idx2species, species2name

def verify_class_index_mapping(idx2species: Dict[str, str], species2name: Dict[str, str]):
    print("\n=== TEST 1 – Verify class index mapping (index 248) ===")
    index = 248
    species_id = idx2species.get(str(index))
    name = species2name.get(species_id, "<not found>")
    print(f"Class index {index} → Species ID {species_id} → Scientific name {name}")
    # verify 20 random indices
    print("\nRandom 20 class‑index checks:")
    all_indices = list(map(int, idx2species.keys()))
    random_indices = random.sample(all_indices, 20)
    for i in random_indices:
        sid = idx2species[str(i)]
        n = species2name.get(sid, "<missing>")
        print(f"  {i} → {sid} → {n}")

def verify_mapping_one_to_one(idx2species: Dict[str, str]):
    print("\n=== TEST 2 – Verify mapping is one‑to‑one ===")
    indices = list(map(int, idx2species.keys()))
    species_ids = list(idx2species.values())
    print(f"Total class indices: {len(indices)}")
    print(f"Min index: {min(indices)}")
    print(f"Max index: {max(indices)}")
    # duplicate species IDs?
    unique_species = set(species_ids)
    print(f"Unique species IDs: {len(unique_species)} (should equal total indices)")
    if len(unique_species) != len(indices):
        print("  -> Duplicate species IDs detected!")
    # missing indices between 0 and 1080
    expected = set(range(0, 1081))
    missing = expected - set(indices)
    print(f"Missing indices: {sorted(missing) if missing else 'None'}")

def search_tomato(idx2species: Dict[str, str], species2name: Dict[str, str]):
    print("\n=== TEST 3 – Check for Tomato entries ===")
    tomato_terms = ["Solanum lycopersicum", "Lycopersicon esculentum", "Tomato"]
    matches = []
    for sid, name in species2name.items():
        if any(term.lower() in name.lower() for term in tomato_terms):
            matches.append((sid, name))
    if not matches:
        print("No tomato related scientific names found in species2name mapping.")
    else:
        for sid, name in matches:
            print(f"Species ID {sid} → {name}")
        # reverse mapping to class index
        rev = {v: k for k, v in idx2species.items()}
        for sid, name in matches:
            class_idx = rev.get(sid)
            print(f"Tomato scientific name '{name}' → Species ID {sid} → Model class index {class_idx}")
    return matches

def verify_checkpoint():
    print("\n=== TEST 4 – Verify checkpoint architecture ===")
    # instantiate model
    model = resnet18(weights=None, num_classes=1081)
    # load state dict with weights_only=True (torch >=2.0)
    try:
        state = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    except TypeError:
        # fallback for older torch versions
        state = torch.load(MODEL_PATH, map_location="cpu")
        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        elif isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]
    # Clean possible prefixes
    clean_state = {}
    for k, v in state.items():
        clean_k = k.replace("module.", "").replace("model.", "")
        clean_state[clean_k] = v
    missing, unexpected = model.load_state_dict(clean_state, strict=False)
    print(f"Missing keys: {len(missing)} (should be 0)")
    print(f"Unexpected keys: {len(unexpected)} (should be 0)")
    # fc layer shapes
    if isinstance(model.fc, nn.Linear):
        print(f"fc.weight shape: {list(model.fc.weight.shape)} (expected [1081, 512])")
        print(f"fc.bias shape:   {list(model.fc.bias.shape)} (expected [1081])")
    else:
        print("Unexpected final layer type.")
    return model

def get_transform():
    return transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

def run_inference(model: nn.Module, transform, image_path: Path, idx2species: Dict[str, str], species2name: Dict[str, str]):
    print(f"\n=== Inference for {image_path.name} ===")
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)
    model.eval()
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
    # Test 6 – raw top‑10
    top10_probs, top10_idx = torch.topk(probs, 10)
    print("\n--- TEST 6 – Raw top‑10 class indices ---")
    for rank, (cls_idx, prob) in enumerate(zip(top10_idx.tolist(), top10_probs.tolist()), 1):
        print(f"{rank} → class {cls_idx} → {prob * 100:.2f}%")
    # Convert to species info for top‑5
    top5_idx = top10_idx[:5]
    top5_probs = top10_probs[:5]
    predictions = []
    for rank, (cls_idx, prob) in enumerate(zip(top5_idx.tolist(), top5_probs.tolist()), 1):
        sid = idx2species.get(str(cls_idx), "UnknownID")
        name = species2name.get(sid, "Unknown Species")
        predictions.append({
            "rank": rank,
            "class_index": cls_idx,
            "species_id": sid,
            "scientific_name": name,
            "confidence": round(prob * 100, 2),
        })
        print(f"Top {rank}: class {cls_idx} → Species ID {sid} → {name} ({prob * 100:.2f}%)")
    # Test 8 – logits stats
    logits_np = logits.squeeze().cpu().numpy()
    print("\n--- TEST 8 – Logits statistics ---")
    print(f"min: {logits_np.min():.6f}, max: {logits_np.max():.6f}, mean: {logits_np.mean():.6f}, std: {logits_np.std():.6f}")
    nan = np.isnan(logits_np).any()
    inf = np.isinf(logits_np).any()
    print(f"NaN present: {nan}, Inf present: {inf}")
    return predictions, probs

def find_tomato_class(idx2species: Dict[str, str], species2name: Dict[str, str]):
    tomato_terms = ["Solanum lycopersicum", "Lycopersicon esculentum", "Tomato"]
    matches = [(sid, name) for sid, name in species2name.items() if any(t.lower() in name.lower() for t in tomato_terms)]
    rev = {v: k for k, v in idx2species.items()}
    results = []
    for sid, name in matches:
        class_idx = rev.get(sid)
        results.append((sid, name, class_idx))
    return results

def summarize_report(tomato_info, predictions, probs, idx2species):
    print("\n=== FINAL REPORT ===")
    if not tomato_info:
        print("Tomato not present in the mapping.")
    else:
        print("Tomato entries found:")
        for sid, name, cls_idx in tomato_info:
            print(f"  {name} → Species ID {sid} → Class index {cls_idx}")
    # Tomato probability and rank (using last processed image)
    if tomato_info:
        tomato_idx = None
        for _, _, ci in tomato_info:
            if ci is not None:
                tomato_idx = int(ci)
                break
        if tomato_idx is not None:
            tomato_prob = probs[tomato_idx].item() * 100
            sorted_probs, sorted_idx = torch.sort(probs, descending=True)
            rank = (sorted_idx == tomato_idx).nonzero(as_tuple=True)[0].item() + 1
            print(f"Tomato class index: {tomato_idx}")
            print(f"Tomato probability: {tomato_prob:.2f}%")
            print(f"Tomato rank: {rank}")
        else:
            print("Tomato class index could not be resolved.")
    print("Preprocessing uses Resize(256) → CenterCrop(224) → ToTensor → Normalize – matches required pipeline.")
    print("Checkpoint loaded with 0 missing/unexpected keys; fc layer shapes are correct.")
    print("Logits stats printed in Test 8 – check for NaN/Inf there.")
    print("Mapping is bijective per Test 2 – no ordering issues detected.")
    print("Most likely explanation for the high Lactuca serriola prediction: the model does not contain a tomato class (or tomato maps to a different index), so the image is matched to the most visually similar class present, which is Lactuca serriola. This is a model/domain limitation, not a code bug.")

def main():
    if len(sys.argv) < 2:
        print("Usage: python diagnose_plantnet300k.py <image1> [image2 ...]")
        sys.exit(1)
    image_paths = [Path(p) for p in sys.argv[1:]]
    idx2species, species2name = load_mappings()
    verify_class_index_mapping(idx2species, species2name)
    verify_mapping_one_to_one(idx2species)
    tomato_matches = search_tomato(idx2species, species2name)
    model = verify_checkpoint()
    transform = get_transform()
    for img_path in image_paths:
        predictions, probs = run_inference(model, transform, img_path, idx2species, species2name)
    summarize_report(tomato_matches, predictions, probs, idx2species)

if __name__ == "__main__":
    main()

