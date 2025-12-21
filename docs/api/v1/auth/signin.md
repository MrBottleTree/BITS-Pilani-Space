# Signup API

The frontend collects the user's information, sends it to the backend, and the backend signs in the user, and returns user's id and tokens.

---

## POST BASE/api/v1/auth/signin

### What this does
- Signs the user in the backend
- Creates 2 tokens.
    - a user access token
    - a user refresh token
- Access token:
    - This is the temporary token that is always attached in a client to server header so that backend can verify the frontend. This token is NEVER stored anywhere in the backend's database.
    - Once expired, the frontend can make use of the refresh token to request the backend for a fresh access token.
- Refresh token:
    - This is a long lived token that has 2 types of expiry. One is, if last used is beyond t1 seconds and another is, if created time is beyond t2 seconds. Now this token expires if atleast one of t1 or t2 time is hit.
    - For example, if we set t1 to be one day and t2 to be one week, a refresh token is created at time t = 0. A user touches this token at t = 10 hours. so now, the t1 becomes 0, t2 is 10 hours. Say, user accesses it at t = 25 hours, t1 just before accessing at t=25 was t1 = 15 hours, just after the t=25 hour access, t1 becomes 0 and t2 is 25 hours. so if atleast one of t1 and t2 exceeds their threshold, they become invalid. like in plain english, if the token is idle for long time, or was created long ago, it expires. This is the logic for the 2 expiry times.
- Why this design?:
    - If we were to maintain only one token per userm, the backend would have to talk to the database for authorising every request. which is painful and not scalable. so the database guy is gonna store refresh token (which is rarely expired) and the cache (RAM) will store the access token which is attached to the refresh token and this access token has one fixed expiry time, that is with respect to when it was created. This helps us to scale a lot because of reduced database access for auth. If server cache (RAM) is cold, then all access tokens are invalidated by default but refresh token stays intact.
    - This also helps the user to stay logged in. They dont have to keep on signing in all the time like quanta AWS.

This should be called only if the frontend is logged out.

---

### What the backend expects

The username must be unique.

The backend expects:
- **email** or **username** (string) field name -> **identifier**
- **password** (string)


Example request body:
```json
{
  "identifier": "user@example.com" or "username",
  "password": "StrongPassword123",
}

```

# What the backend returns

## On successful signin (HTTP 200 - Ok):

### Headers:

```
Set-Cookie: refresh_token=...;
HttpOnly;
Secure;
SameSite=Lax;
Path=/api/v1/auth/refresh
```

### Body:
```json
{
    "id": (integer/string based on our backend design),
    "type": 0 or 1 based on type of user,
    "access_token": short lived access token (string),
    "expires_in": natural number (seconds)
}
```

## On unsuccessful signin (missing fields) (HTTP 400 - Bad Request)

```json
{
    "error": "Missing fields",
    "details":{
        //maybe include some details for frontend to know whats up
    }
}
```

## On unsuccessful signin (incorrect ```identifier``` - ```password``` pair) (HTTP 401 - Unauthorized)

```json
{
    "error": "identifier and password does not match any account",
    "details":{
        //if any, mostly none, Future work.
    }
}
```

## **All other methods will return (HTTP 405 - Method Not Allowed)**