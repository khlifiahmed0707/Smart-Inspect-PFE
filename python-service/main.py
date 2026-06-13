import os
import json
import pickle
import numpy as np
import cv2
import base64
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from deepface import DeepFace
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------------------------------------------
# Smart Inspect AI — TFLite Model Configuration
# ----------------------------------------------------------------
AI_MODEL_DIR = r"C:\Users\HP\Desktop\SmartInspect_AI"
TFLITE_MODEL_PATH = os.path.join(AI_MODEL_DIR, "model_unquant.tflite")
LABELS_PATH = os.path.join(AI_MODEL_DIR, "labels.txt")

# Load TFLite model and labels once at startup
tflite_interpreter = None
tflite_labels = []

def load_tflite_model():
    global tflite_interpreter, tflite_labels
    try:
        import ai_edge_litert.interpreter as tflite
        tflite_interpreter = tflite.Interpreter(model_path=TFLITE_MODEL_PATH)
        tflite_interpreter.allocate_tensors()
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            tflite_labels = [line.strip() for line in f.readlines() if line.strip()]
        print(f"[AI] TFLite model loaded: {TFLITE_MODEL_PATH}")
        print(f"[AI] Labels loaded: {tflite_labels}")
    except Exception as e:
        print(f"[AI ERROR] Failed to load TFLite model: {e}")

app = FastAPI()

# Enable CORS for communication with Spring Boot or React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
VECTOR_PATH = r"C:\Users\HP\Desktop\new_face\face_vector.pkl"
MODEL_NAME = "Facenet"
DISTANCE_METRIC = "cosine"
THRESHOLD = 0.4

# Global variable to store reference vector (Super Admin only)
admin_vector = None

def load_vector():
    global admin_vector
    if os.path.exists(VECTOR_PATH):
        try:
            with open(VECTOR_PATH, 'rb') as f:
                admin_vector = pickle.load(f)
            print(f"[SUCCESS] Loaded super admin face vector from {VECTOR_PATH}")
        except Exception as e:
            print(f"[ERROR] Error loading vector: {e}")
    else:
        print(f"[WARNING] {VECTOR_PATH} not found.")

def decode_image(image_b64: str):
    """Decode a base64 image string to an OpenCV image."""
    encoded_data = image_b64.split(',')[1] if ',' in image_b64 else image_b64
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def get_embedding(img) -> list:
    """Save temp image and extract face embedding using DeepFace."""
    temp_path = "temp_capture.jpg"
    cv2.imwrite(temp_path, img)
    objs = DeepFace.represent(img_path=temp_path, model_name=MODEL_NAME, enforce_detection=False)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    if not objs:
        return None
    return objs[0]["embedding"]

def cosine_distance(vec_a: list, vec_b: list) -> float:
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 1.0
    return 1 - (dot / norm)

@app.on_event("startup")
async def startup_event():
    load_vector()
    load_tflite_model()

# -----------------------------------------------------------------
# Model schemas
# -----------------------------------------------------------------
class FaceVerifyRequest(BaseModel):
    image: str  # Base64 encoded image

class FaceExtractRequest(BaseModel):
    image: str  # Base64 encoded image

class FaceDynamicVerifyRequest(BaseModel):
    image: str            # Base64 encoded captured image
    referenceVector: str  # JSON string of the stored float list, e.g. "[0.1, 0.2, ...]"

# -----------------------------------------------------------------
# Endpoint 1: /verify  — Super Admin (uses PKL file from disk)
# -----------------------------------------------------------------
@app.post("/verify")
async def verify_face(request: FaceVerifyRequest):
    global admin_vector
    if admin_vector is None:
        load_vector()
        if admin_vector is None:
            raise HTTPException(status_code=500, detail="Reference vector not found on server")

    try:
        img = decode_image(request.image)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        captured_vector = get_embedding(img)
        if captured_vector is None:
            return {"match": False, "confidence": 0, "message": "No face detected"}

        distance = cosine_distance(admin_vector, captured_vector)
        is_match = distance < THRESHOLD
        cosine_sim = 1 - distance

        return {
            "match": bool(is_match),
            "distance": float(distance),
            "threshold": THRESHOLD,
            "confidence": float(cosine_sim * 100)
        }

    except Exception as e:
        print(f"Error during super admin verification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------------
# Endpoint 2: /extract — Extract face embedding from an image
# Used during Normal Admin biometric enrollment (first login)
# -----------------------------------------------------------------
@app.post("/extract")
async def extract_face(request: FaceExtractRequest):
    try:
        img = decode_image(request.image)
        if img is None:
            return {"success": False, "message": "Invalid image data"}

        embedding = get_embedding(img)
        if embedding is None:
            return {"success": False, "message": "Aucun visage detecte dans l'image. Verifiez l'eclairage."}

        # Return the vector as a JSON-serializable list
        return {
            "success": True,
            "vector": embedding,
            "message": "Vecteur facial extrait avec succes."
        }

    except Exception as e:
        print(f"[EXTRACT ERROR] {e}")
        return {"success": False, "message": f"Erreur lors de l'extraction: {str(e)}"}

# -----------------------------------------------------------------
# Endpoint 3: /verify-dynamic — Normal Admin recurring login
# Compares captured image against stored vector from DB (not PKL)
# -----------------------------------------------------------------
@app.post("/verify-dynamic")
async def verify_face_dynamic(request: FaceDynamicVerifyRequest):
    try:
        # Parse the stored reference vector from JSON string
        reference_vector = json.loads(request.referenceVector)

        img = decode_image(request.image)
        if img is None:
            return {"match": False, "confidence": 0, "message": "Invalid image data"}

        captured_vector = get_embedding(img)
        if captured_vector is None:
            return {"match": False, "confidence": 0, "message": "Aucun visage detecte."}

        distance = cosine_distance(reference_vector, captured_vector)
        is_match = distance < THRESHOLD
        cosine_sim = 1 - distance

        return {
            "match": bool(is_match),
            "distance": float(distance),
            "threshold": THRESHOLD,
            "confidence": float(cosine_sim * 100),
            "message": "Visage reconnu." if is_match else "Visage non reconnu."
        }

    except Exception as e:
        print(f"[DYNAMIC VERIFY ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------------
# Endpoint 4: /inspect — Industrial AI Inspection (TFLite)
# -----------------------------------------------------------------
class InspectRequest(BaseModel):
    image: str  # Base64 encoded image (from React file upload or webcam)

@app.post("/inspect")
async def inspect_piece(request: InspectRequest):
    global tflite_interpreter, tflite_labels

    if tflite_interpreter is None:
        load_tflite_model()
        if tflite_interpreter is None:
            raise HTTPException(status_code=503, detail="AI model not loaded. Check model path.")

    try:
        # 1. Decode base64 image
        img = decode_image(request.image)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # 2. Preprocessing: RGB conversion + Resize 224x224 + Normalize [-1, 1]
        start_time = time.time()
        image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        input_img = cv2.resize(image_rgb, (224, 224), interpolation=cv2.INTER_AREA)
        input_data = np.expand_dims(input_img, axis=0).astype(np.float32)
        input_data = (input_data / 127.5) - 1

        # 3. Run TFLite inference
        input_details = tflite_interpreter.get_input_details()
        output_details = tflite_interpreter.get_output_details()
        tflite_interpreter.set_tensor(input_details[0]['index'], input_data)
        tflite_interpreter.invoke()
        predictions = tflite_interpreter.get_tensor(output_details[0]['index'])[0]
        inference_time = time.time() - start_time

        # 4. Parse prediction result
        index = int(np.argmax(predictions))
        confidence = float(predictions[index])
        label_full = tflite_labels[index] if index < len(tflite_labels) else "Inconnu"

        # Remove leading index number (e.g., "1 carte de ..." -> "carte de ...")
        clean_label = label_full[2:].strip() if len(label_full) > 2 and label_full[1] == ' ' else label_full

        # 5. Intelligent label parsing: detect "manque" keyword
        if "manque" in clean_label.lower():
            parts = clean_label.lower().split("manque", 1)
            nom_piece = parts[0].strip().title()
            anomalie = "Manque " + parts[1].replace("_", " ").strip().title()
            conformite = "NON CONFORME"
        else:
            nom_piece = clean_label.replace("_", " ").title()
            anomalie = "Aucune (OK)"
            conformite = "CONFORME"

        result = {
            "success": True,
            "nom_piece": nom_piece,
            "conformite": conformite,
            "anomalie": anomalie,
            "confidence": round(confidence * 100, 2),
            "inference_time": round(inference_time, 3),
            "label_raw": label_full,
            "label_index": index
        }

        print(f"[INSPECT] {conformite} | Piece: {nom_piece} | Anomalie: {anomalie} | Conf: {confidence*100:.1f}% | Time: {inference_time:.3f}s")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[INSPECT ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "super_admin_vector_loaded": admin_vector is not None,
        "tflite_model_loaded": tflite_interpreter is not None,
        "labels_count": len(tflite_labels),
        "endpoints": ["/verify", "/extract", "/verify-dynamic", "/inspect"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
