import os
import sys
import json
import importlib
import traceback

def check_pkg(name):
    try:
        mod = importlib.import_module(name)
        return getattr(mod, '__version__', 'Installed (no __version__)')
    except ImportError:
        return "NOT INSTALLED"

print("====================================================")
print("STEP 1 — VERIFY FILES")
print("====================================================")
base_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(base_dir, "models", "plantnet300k")
pth_path = os.path.join(model_dir, "plantnet_resnet18.pth")
json_path = os.path.join(model_dir, "plantnet300k_species_id_2_name.json")

for p in [pth_path, json_path]:
    exists = os.path.exists(p)
    size = os.path.getsize(p) if exists else 0
    print(f"File: {p}")
    print(f"Exists: {exists}")
    print(f"Absolute Path: {os.path.abspath(p)}")
    if exists:
        print(f"Size: {size / (1024*1024):.2f} MB")
    print("-" * 40)

if not os.path.exists(pth_path) or not os.path.exists(json_path):
    print("CRITICAL: Missing required files. Exiting.")
    sys.exit(1)

print("\n====================================================")
print("STEP 2 — INSPECT LABEL MAPPING")
print("====================================================")
with open(json_path, 'r', encoding='utf-8') as f:
    labels = json.load(f)

num_classes = len(labels)
keys = list(labels.keys())
print(f"Total classes: {num_classes}")
print(f"JSON structure: Dictionary mapping {type(keys[0])} to {type(labels[keys[0]])}")
print(f"Are keys integers stored as strings? : {keys[0].isdigit() if isinstance(keys[0], str) else 'No'}")

print("\nFirst 5 mappings:")
for k in keys[:5]:
    print(f"{k} -> {labels[k]}")

print("\nLast 5 mappings:")
for k in keys[-5:]:
    print(f"{k} -> {labels[k]}")

print("\n====================================================")
print("STEP 3 — INSPECT PYTORCH CHECKPOINT")
print("====================================================")
try:
    import torch
except ImportError:
    print("PyTorch is not installed. Exiting step.")
    sys.exit(1)

try:
    checkpoint = torch.load(pth_path, map_location='cpu', weights_only=False)
except TypeError:
    checkpoint = torch.load(pth_path, map_location='cpu')

print(f"Python type of loaded checkpoint: {type(checkpoint)}")

state_dict = None
if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
    print(f"Top-level keys found: {list(checkpoint.keys())}")
    state_dict = checkpoint['state_dict']
elif isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
    print(f"Top-level keys found: {list(checkpoint.keys())}")
    state_dict = checkpoint['model_state_dict']
elif isinstance(checkpoint, dict):
    print("Direct state_dict detected (or raw dictionary without expected wrapper keys).")
    state_dict = checkpoint
else:
    print("Unexpected checkpoint format.")
    state_dict = checkpoint

param_names = list(state_dict.keys())
print(f"\nNumber of tensor parameters: {len(param_names)}")
print("\nFirst 20 parameter names:")
for p in param_names[:20]:
    shape = state_dict[p].shape if hasattr(state_dict[p], 'shape') else 'No shape'
    print(f" - {p} {shape}")

print("\nLast 10 parameter names:")
for p in param_names[-10:]:
    shape = state_dict[p].shape if hasattr(state_dict[p], 'shape') else 'No shape'
    print(f" - {p} {shape}")


print("\n====================================================")
print("STEP 4 — DETERMINE ARCHITECTURE")
print("====================================================")

fc_weight = None
fc_keys = ['fc.weight', 'classifier.weight', 'head.fc.weight']
for k in fc_keys:
    if k in state_dict:
        fc_weight = state_dict[k]
        break
        
out_features = fc_weight.shape[0] if fc_weight is not None else "UNKNOWN"
print(f"1. Number of output classes from final layer: {out_features}")

has_conv1 = 'conv1.weight' in state_dict
has_layer1 = 'layer1.0.conv1.weight' in state_dict
has_layer4 = 'layer4.1.conv2.weight' in state_dict

is_standard_resnet = has_conv1 and has_layer1 and has_layer4
print(f"2. Likely a standard ResNet18: {'Yes' if is_standard_resnet else 'No'}")
print(f"3. Whether torchvision can load it: {'Likely Yes' if is_standard_resnet else 'Uncertain'}")

print("\n====================================================")
print("STEP 5 — DEPENDENCY CHECK")
print("====================================================")
deps = ['torch', 'torchvision', 'timm', 'transformers', 'fastapi', 'PIL']
for d in deps:
    version = check_pkg(d)
    print(f"{d:12}: {version}")

print("\n====================================================")
print("STEP 6 — MODEL LOADING TEST")
print("====================================================")
try:
    from torchvision.models import resnet18
    # If the output classes don't match, fall back to num_classes length
    cls_count = out_features if isinstance(out_features, int) else num_classes
    print(f"Instantiating torchvision resnet18(num_classes={cls_count})...")
    model = resnet18(num_classes=cls_count)
    
    # Strip potential prefixes from saved state dict
    clean_state_dict = {}
    for k, v in state_dict.items():
        clean_k = k.replace('model.', '').replace('module.', '')
        clean_state_dict[clean_k] = v
        
    load_res = model.load_state_dict(clean_state_dict, strict=False)
    print("Model load_state_dict executed with strict=False.")
    
    print(f"Missing keys ({len(load_res.missing_keys)}):")
    if load_res.missing_keys:
        for k in load_res.missing_keys[:5]:
            print(f"  - {k}")
        if len(load_res.missing_keys) > 5:
            print("  - ...")
            
    print(f"Unexpected keys ({len(load_res.unexpected_keys)}):")
    if load_res.unexpected_keys:
        for k in load_res.unexpected_keys[:5]:
            print(f"  - {k}")
        if len(load_res.unexpected_keys) > 5:
            print("  - ...")
            
    if len(load_res.missing_keys) == 0 and len(load_res.unexpected_keys) == 0:
        print(">>> Model loaded PERFECTLY with 0 missing/unexpected keys! <<<")
    else:
        print(">>> Model loaded with some mismatches (see above). <<<")

except Exception as e:
    print(f"Failed to load model architecture: {e}")
    traceback.print_exc()

print("\n====================================================")
print("STEP 7 — INFERENCE PREPROCESSING ANALYSIS")
print("====================================================")
print("CONFIRMED FROM MODEL/FILES:")
print(f"- Architecture Type: {'ResNet18' if is_standard_resnet else 'Unknown'}")
print(f"- Output Classes: {out_features}")
print("\nINFERRED / NEEDS VERIFICATION:")
print("- Input image size: Likely 224x224 or 256x256")
print("- RGB Conversion: Required (PyTorch CV standard)")
print("- Resize Strategy: Likely Resize(256) -> CenterCrop(224) (ResNet default)")
print("- Normalization mean: [0.485, 0.456, 0.406] (ImageNet standard)")
print("- Normalization std: [0.229, 0.224, 0.225] (ImageNet standard)")

print("\n====================================================")
print("STEP 8 — CREATE TEST IMAGE SUPPORT")
print("====================================================")
if len(sys.argv) > 1:
    img_path = sys.argv[1]
    print(f"Test image provided: {img_path}")
    if os.path.exists(img_path):
        try:
            from PIL import Image
            img = Image.open(img_path)
            print(f"Successfully loaded image.")
            print(f"Dimensions: {img.size}")
            print(f"Mode: {img.mode}")
        except Exception as e:
            print(f"Failed to open image via PIL: {e}")
    else:
        print("Image file does not exist at specified path.")
else:
    print("No test image path provided. Skipping image load.")
