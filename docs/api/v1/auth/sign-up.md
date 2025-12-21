# Signup API

The frontend collects the user's information, sends it to the backend, and the backend responds with a user ID.  

---

## POST BASE/api/v1/auth/signup

### What this does
- Creates a new user account.
- Returns the user’s unique ID.
- **Backend does NOT sign in the user YET.**

This endpoint is meant to be called only once per user (during signup).

---

### What the backend expects

The username must be unique.

The backend expects:
- **email** (string)
- **username** (string)
- **password** (string)
- **type** (small natural number, 0 for user, 1 for admin. We can define this later)

Here "type" is either 0 for "user" or 1 for "admin" to signup different kinds of users.

**Safety of this may be managed later on. Potential issue here is that any guy can randomly signup for admin. We can fix this later.**

Example request body:
```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "StrongPassword123",
  "type": "admin"
}

```

### What the backend returns

On successful signup (HTTP 201 - Created):
```json
{
  "id": (integer/string based on our backend design),
}
```

We dont have to return things like username or email because the frontend already has this.

Unsuccessful signup (HTTP 409 - Conflict)

```json
{
  "error": "Username already exists"
}
```

or

```json
{
  "error": "Email in use"
}
```

Unsuccessful signup (HTTP 422 - Unprocessable Content)

```json
{
  "error": "Password does not meet requirement",
  "details":{
    (details maybe like length or soemthing, FUTURE WORK)
  }
}
```

Unsuccessful signup (HTTP 403 - Forbidden)

```json
{
  "error": "Client not allowed to signup as admin"
}
```

## **All other methods will return (HTTP 405 - Method Not Allowed)**