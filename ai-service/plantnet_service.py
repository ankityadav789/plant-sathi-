import io
import json
import torch
from pathlib import Path
from PIL import Image
import torchvision.transforms as transforms
from torchvision.models import resnet18

BASE_DIR = Path(__file__).resolve().parent
PLANTNET_DIR = BASE_DIR / "models" / "plantnet300k"

class PlantNetService:
    def __init__(self):
        self.model = None
        self.transform = None
        self.class_idx_to_species_id = {}
        self.species_id_to_name = {}
        self.is_loaded = False

    def load(self):
        print("[PlantNet] Loading PlantNet-300K ResNet18...")
        try:
            idx_path = PLANTNET_DIR / "class_idx_to_species_id.json"
            name_path = PLANTNET_DIR / "plantnet300K_species_id_2_name.json"
            
            with open(idx_path, 'r', encoding='utf-8') as f:
                self.class_idx_to_species_id = json.load(f)
                
            with open(name_path, 'r', encoding='utf-8') as f:
                self.species_id_to_name = json.load(f)
                
            print("[PlantNet] Species mappings loaded successfully")
            
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

            self.model = resnet18(num_classes=1081)
            
            # Using weights_only=False to support legacy checkpoint format just in case
            try:
                state_dict = torch.load(PLANTNET_DIR / "plantnet_resnet18.pth", map_location='cpu', weights_only=False)
            except TypeError:
                state_dict = torch.load(PLANTNET_DIR / "plantnet_resnet18.pth", map_location='cpu')

            if isinstance(state_dict, dict) and 'state_dict' in state_dict:
                state_dict = state_dict['state_dict']
            elif isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
                
            clean_state_dict = {}
            for k, v in state_dict.items():
                clean_k = k.replace('model.', '').replace('module.', '')
                clean_state_dict[clean_k] = v
                
            self.model.load_state_dict(clean_state_dict, strict=False)
            self.model.eval()
            
            self.is_loaded = True
            print("[PlantNet] Model loaded successfully")
            print(f"[PlantNet] Classes: {len(self.class_idx_to_species_id)}")
        except Exception as e:
            print(f"[PlantNet] ERROR loading model: {e}")
            self.is_loaded = False

    def predict(self, image_bytes):
        if not self.is_loaded:
            raise RuntimeError("PlantNet model is not loaded.")
        
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(img).unsqueeze(0)  # Add batch dimension
        
        with torch.no_grad():
            logits = self.model(tensor)
            
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
        top5_probs, top5_indices = torch.topk(probs, 5)
        
        predictions = []
        for i in range(5):
            prob = top5_probs[i].item() * 100
            idx = top5_indices[i].item()
            
            idx_str = str(idx)
            species_id = self.class_idx_to_species_id.get(idx_str, "UnknownID")
            scientific_name = self.species_id_to_name.get(species_id, "Unknown Species")
            
            predictions.append({
                "rank": i + 1,
                "class_index": idx,
                "species_id": species_id,
                "scientific_name": scientific_name,
                "confidence": round(prob, 2)
            })
            
        return {
            "success": True,
            "model": "PlantNet-300K ResNet18",
            "predictions": predictions,
            "top_prediction": {
                "species_id": predictions[0]["species_id"],
                "scientific_name": predictions[0]["scientific_name"],
                "confidence": predictions[0]["confidence"]
            }
        }

plantnet_service = PlantNetService()
