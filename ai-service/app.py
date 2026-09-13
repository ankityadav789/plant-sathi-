from transformers import AutoImageProcessor, AutoModelForImageClassification
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image
import io
import json
import os
import time
import traceback
import torch


app = FastAPI(title="Plant Disease AI API")


# ============================================================================
# Paths
# ============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DISEASE_REGISTRY_PATH = os.path.join(
    BASE_DIR,
    "..",
    "backend",
    "data",
    "disease_registry.json"
)


# ============================================================================
# Load disease model
# ============================================================================

print("Loading model...")

try:
    processor = AutoImageProcessor.from_pretrained("./")
    model = AutoModelForImageClassification.from_pretrained("./")

    model.eval()

    print("[SUCCESS] Model Loaded Successfully!")

except Exception as e:
    print(f"[ERROR] Failed to load model: {e}")
    raise e


# ============================================================================
# Load disease registry
# ============================================================================

disease_registry = {}

try:
    with open(DISEASE_REGISTRY_PATH, "r", encoding="utf-8") as f:
        disease_registry = json.load(f)

    print(
        f"[SUCCESS] Disease registry loaded: "
        f"{len(disease_registry)} supported species"
    )

except Exception as e:
    print(f"[ERROR] Failed to load disease registry: {e}")
    raise e


# ============================================================================
# PlantNet service
# ============================================================================

from plantnet_service import plantnet_service


@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI Server Started successfully!")
    plantnet_service.load()


# ============================================================================
# Basic endpoints
# ============================================================================

@app.get("/")
async def home():
    return {
        "message": "Plant Disease AI Running Successfully 🚀"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "disease_registry_loaded": bool(disease_registry)
    }


# ============================================================================
# Disease prediction
# ============================================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    species_id: str = Form(...)
) -> JSONResponse:

    print("\n--- [API] New Request Received at /predict ---")
    print(f"File Name: {file.filename}")
    print(f"Content-Type: {file.content_type}")
    print(f"Species ID: {species_id}")

    try:
        start_time = time.time()

        # --------------------------------------------------------------------
        # Validate file
        # --------------------------------------------------------------------

        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        # --------------------------------------------------------------------
        # Validate species against disease registry
        # --------------------------------------------------------------------

        species_id = species_id.strip().lower()

        registry_entry = disease_registry.get(species_id)

        if not registry_entry or not registry_entry.get("supported"):
            print(
                f"-> Disease detection unavailable for species: {species_id}"
            )

            return JSONResponse(
                content={
                    "success": True,
                    "supported": False,
                    "species_id": species_id,
                    "prediction": None,
                    "confidence": None,
                    "message": "No reliable disease classification available for this species."
                }
            )

        disease_model_info = registry_entry.get("disease_model", {})

        allowed_class_indices = disease_model_info.get("class_indices", [])
        allowed_labels = disease_model_info.get("labels", [])

        if not allowed_class_indices:
            return JSONResponse(
                content={
                    "success": True,
                    "supported": False,
                    "species_id": species_id,
                    "prediction": None,
                    "confidence": None,
                    "message": "No disease classes configured for this species."
                }
            )

        print(
            f"-> Allowed disease classes: "
            f"{allowed_class_indices}"
        )

        # --------------------------------------------------------------------
        # Validate registry against loaded model
        # --------------------------------------------------------------------

        model_num_classes = model.config.num_labels

        invalid_indices = [
            idx
            for idx in allowed_class_indices
            if idx < 0 or idx >= model_num_classes
        ]

        if invalid_indices:
            raise RuntimeError(
                f"Invalid disease class indices for {species_id}: "
                f"{invalid_indices}"
            )

        # --------------------------------------------------------------------
        # Read image
        # --------------------------------------------------------------------

        contents = await file.read()

        print(
            f"-> Image received. Size: {len(contents)} bytes"
        )

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        print(
            f"-> Image preprocessed. Size: {image.size}"
        )

        # --------------------------------------------------------------------
        # Processor
        # --------------------------------------------------------------------

        print("-> Processing inputs...")

        inputs = processor(
            images=image,
            return_tensors="pt"
        )

        # --------------------------------------------------------------------
        # Model inference
        # --------------------------------------------------------------------

        print("-> Running model inference...")

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits

        print(
            f"-> Logits shape: {logits.shape}"
        )

        # --------------------------------------------------------------------
        # IMPORTANT:
        # Only evaluate classes belonging to this species.
        # --------------------------------------------------------------------

        allowed_tensor = torch.tensor(
            allowed_class_indices,
            dtype=torch.long,
            device=logits.device
        )

        species_logits = logits[:, allowed_tensor]

        species_probabilities = torch.nn.functional.softmax(
            species_logits,
            dim=-1
        )

        predicted_local_index = (
            species_probabilities.argmax(dim=-1).item()
        )

        predicted_class_idx = (
            allowed_class_indices[predicted_local_index]
        )

        confidence_score = (
            species_probabilities[
                0,
                predicted_local_index
            ].item() * 100
        )

        # --------------------------------------------------------------------
        # Label
        # --------------------------------------------------------------------

        id2label = model.config.id2label or {}

        label = (
            id2label.get(predicted_class_idx)
            or id2label.get(str(predicted_class_idx))
        )

        if label is None:
            label = allowed_labels[predicted_local_index]

        print(
            f"-> Predicted global class index: "
            f"{predicted_class_idx}"
        )

        print(
            f"-> Predicted class: {label}"
        )

        print(
            f"-> Species: {species_id}"
        )

        print(
            f"-> Confidence: {confidence_score:.2f}%"
        )

        # --------------------------------------------------------------------
        # Return top predictions restricted to this species
        # --------------------------------------------------------------------

        top_k = min(
            len(allowed_class_indices),
            5
        )

        top_values, top_positions = torch.topk(
            species_probabilities[0],
            k=top_k
        )

        all_predictions = []

        for value, position in zip(
            top_values.tolist(),
            top_positions.tolist()
        ):
            global_idx = allowed_class_indices[position]

            prediction_label = (
                id2label.get(global_idx)
                or id2label.get(str(global_idx))
                or allowed_labels[position]
            )

            all_predictions.append({
                "class_index": global_idx,
                "label": prediction_label,
                "confidence": round(value * 100, 2)
            })

        response_data = {
            "success": True,
            "supported": True,
            "species_id": species_id,
            "prediction": label,
            "confidence": round(confidence_score, 2),
            "class_index": predicted_class_idx,
            "all_predictions": all_predictions
        }

        print(
            f"-> Response sent to Node.js in "
            f"{time.time() - start_time:.3f}s: "
            f"{response_data}\n"
        )

        return JSONResponse(
            content=response_data
        )

    except HTTPException:
        raise

    except Exception as e:
        print(
            f"\n[ERROR] Prediction failed: {str(e)}"
        )

        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )


# ============================================================================
# Local PlantNet species identification
# ============================================================================

@app.post("/identify-species")
async def identify_species(
    file: UploadFile = File(...)
) -> JSONResponse:

    """Identify plant species using local PlantNet-300K model."""

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image"
        )

    try:
        contents = await file.read()

        result = plantnet_service.predict(
            contents
        )

        return JSONResponse(
            content=result
        )

    except HTTPException:
        raise

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )