import json
import os
import re
from collections import Counter

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Project root (two levels up from this script)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

PLANT_NAMES_PATH = os.path.join(BASE_DIR, 'backend', 'plant_names.json')

IDX2SPECIES_PATH = os.path.join(
    BASE_DIR,
    'ai-service',
    'models',
    'plantnet300k',
    'class_idx_to_species_id.json',
)
SPECIES2NAME_PATH = os.path.join(
    BASE_DIR,
    'ai-service',
    'models',
    'plantnet300k',
    'plantnet300K_species_id_2_name.json',
)

REGISTRY_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'species_registry.json')
PLANTNET_META_PATH = os.path.join(
    BASE_DIR, 'backend', 'data', 'plantnet300k_species.json'
)
AMBIGUITY_REPORT_PATH = os.path.join(
    BASE_DIR, 'backend', 'data', 'species_registry_ambiguities.json'
)

# Safety switch. Keep False for the first validation run.
WRITE_OUTPUT = False

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def canonical_id(name: str) -> str:
    """Convert a normalized scientific name to a snake_case canonical ID."""
    s = name.strip().lower()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    s = re.sub(r'_+', '_', s)
    return s.strip('_')


def normalize_scientific_name(name: str | None) -> str | None:
    """Safely extract bare Genus species from PlantNet scientific metadata.

    This function is intentionally used for PlantNet metadata, where the
    source field is known to be a scientific name. It is NOT used to decide
    whether a project key from plant_names.json is scientific.
    """
    if not name or not isinstance(name, str):
        return None

    unsafe_tokens = ('×', 'subsp.', 'ssp.', 'var.', 'subspecies', 'variety')
    if any(tok in name.lower() for tok in unsafe_tokens):
        return None

    # Reject botanical hybrid notation: Genus x species
    if re.search(r'\s+x\s+', name, flags=re.IGNORECASE):
        return None

    # Genus species, followed optionally by author citation text.
    m = re.search(r'^([A-Za-z]+)\s+([a-z]+)(?:\s|$)', name.strip())
    if not m:
        return None

    # Normalize genus capitalization while preserving the epithet.
    return f"{m.group(1).capitalize()} {m.group(2).lower()}"


# ---------------------------------------------------------------------------
# PROJECT TAXONOMY
# ---------------------------------------------------------------------------
# IMPORTANT:
# plant_names.json contains BOTH scientific names and common names.
# Never infer "scientific name" merely from "two English words".
#
# These are the project keys explicitly treated as scientific-name entries.
PROJECT_SCIENTIFIC_NAMES = {
    'bystropogon canariensis',
    'ocimum gratissimum',
    'coleus amboinicus',
    'coleus hadiensis',
    'coleus barbatus',
    'salvadora persica',
    'hibiscus fragilis',
    'aloe dorotheae',
    'tagetes tenuifolia',
    'tagetes erecta',
    'tagetes minuta',
    'mutarda nigra',
    'mutarda arvensis',
    'brassica napus',
    'ipomoea aquatica',
    'rumex brownii',
    'capsicum annuum',
    'solanum lycopersicum',
    'citrullus lanatus',
    'glycine max',
    'plectranthus amboinicus',
    'plectranthus barbatus',
    'plectranthus parviflorus',
    'medicago sativa',
    'hydrangea petiolaris',
    'prunus serrulata',
    'malus domestica',
    'fraxinus angustifolia',
    'ocimum kilimandscharicum',
    'glycyrrhiza glabra',
    'robinia hispida',
    'hibiscus rosa-sinensis',
    'hibiscus schizopetalus',
    'duranta erecta',
}

# Explicit, project-level alias mappings. These are deliberately explicit so
# common names never become fake scientific names.
#
# Ambiguous generic names such as "rose", "jasmine", "mint", "marigold" and
# "bougainvillea" are intentionally left unresolved rather than guessed.
PROJECT_ALIAS_TO_CANONICAL = {
    # Existing project synonym groups
    'tulsi': 'ocimum_tenuiflorum',
    'tulasi': 'ocimum_tenuiflorum',
    'holy basil': 'ocimum_tenuiflorum',
    'ocimum tenuiflorum': 'ocimum_tenuiflorum',

    'tomato': 'solanum_lycopersicum',
    'garden tomato': 'solanum_lycopersicum',
    'solanum lycopersicum': 'solanum_lycopersicum',

    # Common-name mappings with a single intended species in this project
    'butterfly pea': 'clitoria_ternatea',
    'toothbrush tree': 'salvadora_persica',
    'neem': 'azadirachta_indica',
    'mango': 'mangifera_indica',
    'sunflower': 'helianthus_annuus',
    'money plant': 'epipremnum_aureum',
    'monstera': 'monstera_deliciosa',
    'swiss cheese plant': 'monstera_deliciosa',
    'golden pothos': 'epipremnum_aureum',
    'snake plant': 'dracaena_trifasciata',
    'peace lily': 'spathiphyllum_wallisii',
    'aloe vera': 'aloe_vera',
    'rubber plant': 'ficus_elastica',
    'hibiscus': 'hibiscus_rosa_sinensis',
    'peepal': 'ficus_religiosa',
    'banyan': 'ficus_benghalensis',
    'mogra': 'jasminum_sambac',
    'curry leaf': 'murraya_koenigii',
    'periwinkle': 'catharanthus_roseus',
    'oleander': 'nerium_oleander',
    'jade plant': 'crassula_ovata',
    'spider plant': 'chlorophytum_comosum',
    'zz plant': 'zamioculcas_zamiifolia',
    'areca palm': 'dypsis_lutescens',

    # Project pairs where the scientific name exists in plant_names.json
    'african marigold': 'tagetes_erecta',
    'swamp morning glory': 'ipomoea_aquatica',
    'rape': 'brassica_napus',
    'watermelon': 'citrullus_lanatus',
    'soya bean': 'glycine_max',
    'forskohlii': 'plectranthus_barbatus',
    'alfalfa': 'medicago_sativa',
    'liquorice': 'glycyrrhiza_glabra',
    'chinese hibiscus': 'hibiscus_rosa_sinensis',
    'hibiscus × rosa-sinensis': 'hibiscus_rosa_sinensis',
}

EXPLICIT_COMMON_NAMES = {
    'ocimum_tenuiflorum': 'Tulsi',
    'solanum_lycopersicum': 'Tomato',
    'clitoria_ternatea': 'Butterfly pea',
    'salvadora_persica': 'Toothbrush tree',
    'azadirachta_indica': 'Neem',
    'mangifera_indica': 'Mango',
    'helianthus_annuus': 'Sunflower',
    'epipremnum_aureum': 'Money plant',
    'monstera_deliciosa': 'Monstera',
    'dracaena_trifasciata': 'Snake plant',
    'spathiphyllum_wallisii': 'Peace lily',
    'aloe_vera': 'Aloe vera',
    'ficus_elastica': 'Rubber plant',
    'hibiscus_rosa_sinensis': 'Chinese hibiscus',
    'ficus_religiosa': 'Peepal',
    'ficus_benghalensis': 'Banyan',
    'jasminum_sambac': 'Mogra',
    'murraya_koenigii': 'Curry leaf',
    'catharanthus_roseus': 'Periwinkle',
    'nerium_oleander': 'Oleander',
    'crassula_ovata': 'Jade plant',
    'chlorophytum_comosum': 'Spider plant',
    'zamioculcas_zamiifolia': 'ZZ plant',
    'dypsis_lutescens': 'Areca palm',
}

PROJECT_SCIENTIFIC_BY_CANONICAL = {
    canonical_id(name): name
    for name in PROJECT_SCIENTIFIC_NAMES
}

RAW_KEY_TO_CANONICAL = {
    key.lower(): cid
    for key, cid in PROJECT_ALIAS_TO_CANONICAL.items()
}

# ---------------------------------------------------------------------------
# STAGE A – PlantNet-300K metadata (keyed by model class index)
# ---------------------------------------------------------------------------
with open(IDX2SPECIES_PATH, 'r', encoding='utf-8') as f:
    idx2species = json.load(f)
with open(SPECIES2NAME_PATH, 'r', encoding='utf-8') as f:
    species2name = json.load(f)

plantnet_meta_by_class = {}
canonical_to_class_indices = {}

for class_idx_str, species_id in idx2species.items():
    class_idx = int(class_idx_str)
    source_name = species2name.get(str(species_id))
    if source_name is None:
        source_name = species2name.get(species_id)

    normalized = normalize_scientific_name(source_name)
    cid = canonical_id(normalized) if normalized else None

    entry = {
        'model_class_index': class_idx,
        'plantnet_species_id': species_id,
        'scientific_name': normalized if normalized else source_name,
        'source_scientific_name': source_name,
        'canonical_species_id': cid,
    }

    plantnet_meta_by_class[str(class_idx)] = entry
    if cid:
        canonical_to_class_indices.setdefault(cid, []).append(class_idx)

# Build PlantNet canonical lookup by normalized scientific name
PLANTNET_CANONICAL_BY_NORMALIZED = {}

for class_idx_str, entry in plantnet_meta_by_class.items():
    normalized = entry.get("scientific_name")
    cid = entry.get("canonical_species_id")

    if normalized and cid:
        PLANTNET_CANONICAL_BY_NORMALIZED[normalized.lower()] = cid

# ---------------------------------------------------------------------------
# STAGE B – Project canonical registry
# ---------------------------------------------------------------------------
with open(PLANT_NAMES_PATH, 'r', encoding='utf-8') as f:
    plant_names = json.load(f)

registry = {}
ambiguities = []


def ensure_registry_entry(cid: str, scientific_name: str | None = None,
                          common_name: str | None = None,
                          hindi_name: str | None = None) -> dict:
    entry = registry.setdefault(cid, {
        'scientific_name': scientific_name,
        'source_scientific_names': [],
        'common_name': common_name or EXPLICIT_COMMON_NAMES.get(cid),
        'hindi_name': hindi_name,
        'aliases': [],
        'identification': {
            'plantnet300k': cid in canonical_to_class_indices,
            'plantnet_api': 'unknown',
            'project_supported': True,
        },
        'disease': {'status': 'unknown'},
    })

    if scientific_name and not entry.get('scientific_name'):
        entry['scientific_name'] = scientific_name
    if common_name and not entry.get('common_name'):
        entry['common_name'] = common_name
    if hindi_name and not entry.get('hindi_name'):
        entry['hindi_name'] = hindi_name

    return entry


# -------- 1. Scientific-name pass --------
# Only exact keys listed in PROJECT_SCIENTIFIC_NAMES are accepted here.
for raw_key, hindi_name in plant_names.items():
    key_lc = raw_key.strip().lower()

    if key_lc not in PROJECT_SCIENTIFIC_NAMES:
        continue

    normalized = f"{raw_key.strip().split()[0].capitalize()} {raw_key.strip().split()[1].lower()}"
    cid = canonical_id(normalized)
    entry = ensure_registry_entry(cid, normalized, hindi_name=hindi_name)

    if raw_key not in entry['source_scientific_names']:
        entry['source_scientific_names'].append(raw_key)

# Ensure every scientific target used by an explicit alias has a canonical
# registry entry, even when plant_names.json contains only the common alias.
for cid, scientific_name in PROJECT_SCIENTIFIC_BY_CANONICAL.items():
    ensure_registry_entry(cid, scientific_name)

# Explicitly declared alias-only species.
ALIAS_ONLY_SCIENTIFIC_NAMES = {
    'clitoria_ternatea': 'Clitoria ternatea',
    'azadirachta_indica': 'Azadirachta indica',
    'mangifera_indica': 'Mangifera indica',
    'helianthus_annuus': 'Helianthus annuus',
    'epipremnum_aureum': 'Epipremnum aureum',
    'monstera_deliciosa': 'Monstera deliciosa',
    'dracaena_trifasciata': 'Dracaena trifasciata',
    'spathiphyllum_wallisii': 'Spathiphyllum wallisii',
    'aloe_vera': 'Aloe vera',
    'ficus_elastica': 'Ficus elastica',
    'ficus_religiosa': 'Ficus religiosa',
    'ficus_benghalensis': 'Ficus benghalensis',
    'jasminum_sambac': 'Jasminum sambac',
    'murraya_koenigii': 'Murraya koenigii',
    'catharanthus_roseus': 'Catharanthus roseus',
    'nerium_oleander': 'Nerium oleander',
    'crassula_ovata': 'Crassula ovata',
    'chlorophytum_comosum': 'Chlorophytum comosum',
    'zamioculcas_zamiifolia': 'Zamioculcas zamiifolia',
    'dypsis_lutescens': 'Dypsis lutescens',
}

for cid, scientific_name in ALIAS_ONLY_SCIENTIFIC_NAMES.items():
    ensure_registry_entry(cid, scientific_name)

# -------- 2. Explicit alias pass --------
for raw_key, hindi_name in plant_names.items():
    key_lc = raw_key.strip().lower()
    cid = RAW_KEY_TO_CANONICAL.get(key_lc)
    if cid is None:
        continue

    # Scientific keys remain source scientific names; don't also create a
    # duplicate registry entry from their wording.
    entry = ensure_registry_entry(cid, hindi_name=hindi_name)

    is_scientific_key = key_lc in PROJECT_SCIENTIFIC_NAMES
    if not is_scientific_key and raw_key not in entry['aliases']:
        entry['aliases'].append(raw_key)

# Add explicitly verified aliases even when the alias key is absent from the
# project file, while avoiding scientific-name aliases being duplicated.
for alias, cid in PROJECT_ALIAS_TO_CANONICAL.items():
    entry = ensure_registry_entry(cid)
    if alias not in {a.lower() for a in entry['aliases']} and alias not in PROJECT_SCIENTIFIC_NAMES:
        entry['aliases'].append(alias)

# Fill canonical scientific names for the explicit groups where available.
for cid, aliases in {
    'ocimum_tenuiflorum': ['ocimum tenuiflorum'],
    'solanum_lycopersicum': ['solanum lycopersicum'],
}.items():
    if not registry.get(cid, {}).get('scientific_name'):
        registry[cid]['scientific_name'] = aliases[0].title()

# -------- 3. Unresolved project keys --------
resolved_project_keys = set(PROJECT_SCIENTIFIC_NAMES) | set(RAW_KEY_TO_CANONICAL)
for raw_key in plant_names:
    if raw_key.strip().lower() not in resolved_project_keys:
        ambiguities.append({
            'type': 'unresolved_alias',
            'alias': raw_key,
            'reason': 'no explicit scientific-name classification or reliable project alias mapping',
        })

# -------- 4. Alias collision detection --------
alias_to_canonical = {}
for raw_key in plant_names:
    key_lc = raw_key.strip().lower()
    cid = RAW_KEY_TO_CANONICAL.get(key_lc)
    if cid:
        norm_alias = canonical_id(key_lc)
        alias_to_canonical.setdefault(norm_alias, set()).add(cid)

for alias, cids in alias_to_canonical.items():
    if len(cids) > 1:
        ambiguities.append({
            'type': 'alias_collision',
            'alias': alias,
            'canonical_ids': sorted(cids),
        })

# -------- 5. PlantNet canonical-ID collisions --------
for cid, indices in canonical_to_class_indices.items():
    if len(indices) > 1:
        ambiguities.append({
            'type': 'plantnet_canonical_collision',
            'canonical_id': cid,
            'model_class_indices': indices,
        })

print('\n--- PlantNet canonical collisions ---')
for cid, indices in canonical_to_class_indices.items():
    if len(indices) > 1:
        print(f'\nCanonical ID: {cid}')
        for idx in indices:
            entry = plantnet_meta_by_class[str(idx)]
            print(
                f"  class_index={idx} | "
                f"species_id={entry['plantnet_species_id']} | "
                f"source_name={entry['source_scientific_name']} | "
                f"normalized={entry['scientific_name']}"
            )

# -------- 6. Validation --------
def resolve_example(example: str) -> str | None:
    key_lc = example.strip().lower()

    # Project aliases
    if key_lc in RAW_KEY_TO_CANONICAL:
        return RAW_KEY_TO_CANONICAL[key_lc]

    # Explicit project scientific names
    if key_lc in PLANTNET_CANONICAL_BY_NORMALIZED:
        return PLANTNET_CANONICAL_BY_NORMALIZED[key_lc]

    # PlantNet scientific names
    normalized = normalize_scientific_name(example)
    if normalized:
        normalized_lc = normalized.lower()
        if normalized_lc in PLANTNET_CANONICAL_BY_NORMALIZED:
            return PLANTNET_CANONICAL_BY_NORMALIZED[normalized_lc]
        return canonical_id(normalized)

    return None


def plantnet_has_canonical_species(cid: str | None) -> bool:
    return bool(cid) and cid in canonical_to_class_indices


validation_examples = [
    'tomato',
    'Solanum lycopersicum',
    'garden tomato',
    'neem',
    'money plant',
    'golden pothos',
    'Lactuca serriola',
    'Acalypha indica',
    'tulsi',
    'tulasi',
    'holy basil',
    'Ocimum tenuiflorum',
    'duranta erecta',
]

validation = {}
for example in validation_examples:
    cid = resolve_example(example)
    entry = registry.get(cid) if cid else None
    validation[example] = {
        'canonical_id': cid,
        'project_registry': entry is not None,
        'plantnet300k': plantnet_has_canonical_species(cid),
    }

# -------- 7. Summary --------
num_plantnet_classes = len(plantnet_meta_by_class)
expected_indices = {str(i) for i in range(1081)}
actual_indices = set(plantnet_meta_by_class.keys())
if actual_indices != expected_indices:
    missing = sorted(expected_indices - actual_indices)
    extra = sorted(actual_indices - expected_indices)
    raise RuntimeError(
        f'PlantNet class-index validation failed. Missing={missing}, Extra={extra}'
    )
print('PlantNet class indices validated: 0-1080')

num_canonical = len(registry)
num_project_supported = sum(
    1 for e in registry.values() if e['identification']['project_supported']
)
num_project_plantnet_overlap = sum(
    1 for e in registry.values() if e['identification']['plantnet300k']
)
num_aliases = sum(len(e['aliases']) for e in registry.values())
num_ambiguities = len(ambiguities)

project_plantnet_overlap = [
    {
        'canonical_species_id': cid,
        'scientific_name': entry.get('scientific_name'),
        'common_name': entry.get('common_name'),
    }
    for cid, entry in registry.items()
    if entry['identification']['plantnet300k']
]

print('\n--- Project ↔ PlantNet-300K overlap ---')
for item in project_plantnet_overlap:
    print(
        f"{item['canonical_species_id']} | "
        f"{item['scientific_name']} | "
        f"{item['common_name']}"
    )

ambiguity_counts = Counter(item.get('type', 'unknown') for item in ambiguities)
print('\n--- Ambiguity breakdown ---')
for ambiguity_type, count in ambiguity_counts.items():
    print(f'{ambiguity_type}: {count}')

print('\n--- Unresolved aliases ---')
for item in ambiguities:
    if item.get('type') == 'unresolved_alias':
        print(f"- {item.get('alias')}")

print(f'✅ PlantNet‑300K classes: {num_plantnet_classes}')
print(f'✅ Canonical registry entries: {num_canonical}')
print(f'✅ Project‑supported species: {num_project_supported}')
print(f'✅ Species overlapping PlantNet‑300K: {num_project_plantnet_overlap}')
print(f'✅ Total aliases collected: {num_aliases}')
print(f'✅ Ambiguity cases detected: {num_ambiguities}')

print('\n--- Example validation ---')
for ex, data in validation.items():
    print(f'{ex!r}:')
    print(f"  canonical_id = {data['canonical_id']}")
    print(f"  project_registry = {data['project_registry']}")
    print(f"  plantnet300k = {data['plantnet300k']}")

# -------- 8. Write output --------
if WRITE_OUTPUT:
    os.makedirs(os.path.dirname(REGISTRY_PATH), exist_ok=True)
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(registry, f, ensure_ascii=False, indent=2)
    with open(PLANTNET_META_PATH, 'w', encoding='utf-8') as f:
        json.dump(plantnet_meta_by_class, f, ensure_ascii=False, indent=2)
    with open(AMBIGUITY_REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(ambiguities, f, ensure_ascii=False, indent=2)
    print('\n✅ Files written: species_registry.json, plantnet300k_species.json, species_registry_ambiguities.json')
