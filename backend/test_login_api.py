import requests

BASE_URL = "http://192.168.1.21:8081/api/personnes/login"

print("--- Testing Login API ---")

# 1. Test normal user fail
print("\n--- 1. Normal User (Wrong Password) ---")
resp = requests.post(BASE_URL, json={
    "email": "test.submit@gmail.com",
    "password": "wrongpassword"
})
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)

# 2. Test Admin login (should ask for face auth)
print("\n--- 2. Admin Login ---")
resp = requests.post(BASE_URL, json={
    "email": "ahmedkhlifi0707@gmail.com",
    "password": "123123"
})
print(f"Status: {resp.status_code}")
try:
    print(resp.json())
except:
    print(resp.text)
