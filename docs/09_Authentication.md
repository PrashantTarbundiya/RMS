# 09 Authentication & Security

## Current State of Authentication
Currently, RMS Face AI is designed as a **Trusted Local Network Appliance**. There is **no traditional username/password authentication layer** (e.g., JWT, OAuth, or Session Cookies) implemented out-of-the-box. 

Because the system is intended to run on an edge device (such as a local physical server or a kiosk restricted to a corporate VLAN), the security model relies on Network Isolation.

## Network Level Security (CORS)
While API-level Auth is missing, the backend strictly enforces Cross-Origin Resource Sharing (CORS) in production to prevent Cross-Site Request Forgery (CSRF) or rogue frontend injection.

In `server.py`:
```python
allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
frontend_url = os.environ.get('FRONTEND_URL')
if frontend_url:
    allowed_origins.append(frontend_url.rstrip('/'))
    CORS(app, origins=allowed_origins)
else:
    CORS(app) # Local Dev Mode
```

## Security Considerations & Attack Vectors
1. **Physical Spoofing (Presentation Attacks):**
   - The current pipeline relies entirely on 2D visual data. It does not currently implement Liveness Detection (e.g., depth-mapping, blink detection). A high-resolution photograph of an employee held up to the camera could potentially trigger a False Positive.
2. **API Exposure:**
   - If the local network is breached, any machine on the network can hit `POST /api/add_person` and inject a malicious actor into the database, granting them physical access.

## Recommendation: Implementing JWT
If RMS Face AI is ever deployed to the public internet (Cloud Deployment), a standard Authentication flow MUST be implemented.

### Proposed Login Flow
1. **Registration:** Admin creates an account via `POST /auth/register` (hashing passwords with `bcrypt`).
2. **Login:** Admin submits credentials to `POST /auth/login`.
3. **Tokens:** Backend validates credentials and issues a short-lived **JWT (JSON Web Token)** Access Token (15m expiry) and an HttpOnly **Refresh Token** (7d expiry).
4. **Authorization:** 
   - Every protected API route (e.g., `/api/add_person`, `/api/retrain`) should be wrapped with a `@jwt_required()` decorator.
   - The Frontend & Mobile apps must attach the Access Token in the `Authorization: Bearer <token>` header for all Axio requests.

### Data Privacy
All embeddings in `encodings.pickle` are mathematical abstractions, not actual images. If the `.pickle` file is stolen, it cannot be reverse-engineered back into human faces, providing strong mathematical privacy. However, the `/dataset_cleaned` directory holds raw JPEGs, meaning the host server's filesystem must be heavily encrypted at rest.
