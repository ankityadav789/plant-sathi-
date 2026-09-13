import json

with open("backend/data/species_registry.json", encoding="utf-8") as f:
    registry = json.load(f)

terms = [
    "vaccinium",
    "vitis",
    "citrus",
    "prunus",
    "cucurbita",
    "fragaria",
]

for canonical_id, entry in registry.items():
    scientific_name = str(entry.get("scientific_name", "")).lower()

    if any(term in scientific_name for term in terms):
        print(f"{canonical_id} -> {entry.get('scientific_name')}")