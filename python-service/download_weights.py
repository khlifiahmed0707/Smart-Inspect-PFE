from deepface import DeepFace
import os

print("Force downloading Facenet weights...")
try:
    # This should trigger the download for the weights file.
    DeepFace.build_model("Facenet")
    print("Download finished!")
except Exception as e:
    print(f"Download failed: {e}")
