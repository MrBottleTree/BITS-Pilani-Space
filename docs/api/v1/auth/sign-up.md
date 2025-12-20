# Signup API

The frontend collects the user's information, sends it to the backend, and the backend responds with a user ID.  

---

## POST BASE/api/v1/auth/signup

### What this does
- Creates a new user account.
- Returns the user’s unique ID.
- Backend does NOT sign in the user YET.

This endpoint is meant to be called only once per user (during signup).

---

### What the backend expects

The username must be unique.

The backend expects:
- **email** (string)
- **username** (string)
- **password** (string)
- **type** (string)

Here "type" is either "user" or "admin" to signup different kinds of users.

**Safety of this may be managed later on**

Example request body:
```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "StrongPassword123",
  "type": "admin"
}
