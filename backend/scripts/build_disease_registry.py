import json
import os
import re

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

SPECIES_REGISTRY_PATH = os.path.join(
    BASE_DIR, "backend", "data", "species_registry.json"
)

CONFIG_PATH = os.path.join(
    BASE_DIR, "ai-service", "config.json"
)

OUTPUT_PATH = os.path.join(
    BASE_DIR, "backend", "data", "disease_registry.json"
)

WRITE_OUTPUT = True  # Set to False to skip writing the output file

def normalize_label(label: str) -> str:
    return re.sub(r"\s+", " ", label.strip())

def crop_prefix(label: str) -> str:
    return normalize_label(label).split("___", 1)[0]

with open(SPECIES_REGISTRY_PATH, "r", encoding="utf-8") as f:
    species_registry = json.load(f)

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

id2label = config["id2label"]

# ---------------------------------------------------------------------------
# Exact canonical mappings already known from the project's taxonomy.
# We deliberately keep this explicit rather than guessing from names.
# ---------------------------------------------------------------------------
DISEASE_CROP_TO_SPECIES = {
    "Apple": "malus_domestica",
    "Blueberry": "vaccinium_corymbosum",
    "Cherry_(including_sour)": "prunus_avium",
    "Corn_(maize)": "zea_mays",
    "Grape": "vitis_vinifera",
    "Orange": "citrus_sinensis",
    "Peach": "prunus_persica",
    "Pepper,_bell": "capsicum_annuum",
    "Potato": "solanum_tuberosum",
    "Raspberry": "rubus_idaeus",
    "Soybean": "glycine_max",
    "Squash": "cucurbita_pepo",
    "Strawberry": "fragaria_ananassa",
    "Tomato": "solanum_lycopersicum",
}

SCIENTIFIC_NAMES = {
    "malus_domestica": "Malus domestica",
    "vaccinium_corymbosum": "Vaccinium corymbosum",
    "prunus_avium": "Prunus avium",
    "zea_mays": "Zea mays",
    "vitis_vinifera": "Vitis vinifera",
    "citrus_sinensis": "Citrus sinensis",
    "prunus_persica": "Prunus persica",
    "capsicum_annuum": "Capsicum annuum",
    "solanum_tuberosum": "Solanum tuberosum",
    "rubus_idaeus": "Rubus idaeus",
    "glycine_max": "Glycine max",
    "cucurbita_pepo": "Cucurbita pepo",
    "fragaria_ananassa": "Fragaria × ananassa",
    "solanum_lycopersicum": "Solanum lycopersicum",
}

disease_registry = {}
unresolved_crops = []
invalid_labels = []

for class_idx_str, label in id2label.items():
    try:
        class_idx = int(class_idx_str)
    except ValueError:
        invalid_labels.append({
            "class_index": class_idx_str,
            "label": label,
            "reason": "class index is not an integer"
        })
        continue

    if "___" not in label:
        invalid_labels.append({
            "class_index": class_idx,
            "label": label,
            "reason": "missing ___ separator"
        })
        continue

    crop = crop_prefix(label)
    species_id = DISEASE_CROP_TO_SPECIES.get(crop)

    if species_id is None:
        unresolved_crops.append(crop)
        continue

    entry = disease_registry.setdefault(species_id, {
        "scientific_name": SCIENTIFIC_NAMES[species_id],
        "supported": True,
        "disease_model": {
            "name": "agri-plant-disease-resnet50",
            "source": "local",
            "class_indices": [],
            "labels": []
        }
    })

    entry["disease_model"]["class_indices"].append(class_idx)
    entry["disease_model"]["labels"].append(label)

# Remove duplicates while preserving order
unresolved_crops = list(dict.fromkeys(unresolved_crops))

print("\n--- Disease Registry ---")

for species_id, entry in disease_registry.items():
    print(f"{species_id}: {len(entry['disease_model']['labels'])} classes")

print("\n--- Unresolved disease crops ---")
for crop in unresolved_crops:
    print(f"- {crop}")

print(f"\n✅ Disease model classes: {len(id2label)}")
print(f"✅ Species with disease mappings: {len(disease_registry)}")
print(f"✅ Unresolved disease crops: {len(unresolved_crops)}")
print(f"✅ Invalid labels: {len(invalid_labels)}")

if WRITE_OUTPUT:
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(disease_registry, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Written: {OUTPUT_PATH}")
