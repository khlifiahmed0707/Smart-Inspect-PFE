import requests

BASE_URL = "http://192.168.1.21:8081/api/personnes"

print("--- Testing API ---")

# 1. Add a test user
print("\n--- 1. Add test user ---")
resp = requests.post(BASE_URL, json={
    "email": "test_update@gmail.com",
    "nom": "Test",
    "prenom": "Update",
    "password": "123",
    "numeroCarteIdentite": "99999999",
    "enabled": True
})
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)

# 2. Update the email
print("\n--- 2. Update email ---")
resp = requests.put(f"{BASE_URL}/update/test_update@gmail.com", json={
    "email": "test_updated_now@gmail.com",
    "nom": "Test updated",
    "prenom": "Update",
    "password": "123",
    "numeroCarteIdentite": "99999999", # CIN stays same
    "enabled": True
})
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)

# 3. Get the user to verify update
print("\n--- 3. Get updated user by CIN ---")
resp = requests.get(f"{BASE_URL}/by-cin/99999999")
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)

# 4. Delete the user to verify message
print("\n--- 4. Delete user ---")
resp = requests.delete(f"{BASE_URL}/test_updated_now@gmail.com")
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)
