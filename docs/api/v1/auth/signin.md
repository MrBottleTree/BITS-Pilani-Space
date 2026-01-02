# **Signup API**

The frontend **collects the user's information**, sends it to the backend, and the backend signs in the user, and returns **user's id** and **tokens**.

---

## POST BASE/api/v1/auth/signin

### What this does
- Signs the user in the backend
- Creates 2 tokens.
    - a **user access token**
    - a **user refresh token**
- ***Access token***:
    - This is the temporary token that is always attached in a client to server header so that backend can verify the frontend. This token is **NEVER** stored anywhere in the **backend's database**.
    - Once expired, the frontend can make use of the refresh token to request the backend for a fresh access token.
- ***Refresh token***:
    - This is a long lived token that has 2 types of expiry:
      - **Timeout** - The duration for which inactivity is tolerated before the session expires.
      - **Lifetime** - The duration from creation after which the token is invalidated.
    - **Example for Timeout** - if timeout is set to 1 day, then if the token is accessed prior to 24 hours then we reset the variable which tracks time since last accessed to 0 to restart the counter till timeout. If the access time however, exceeded the time limit then we revoke access since the session has expired due to inactivity.
    - **Example for Lifetime** - if token was created at time `t = 0` and the Lifetime is set to 1 week, then after 1 week from the time of creation, the session will have expired due to exceeding it's predetermined validity period.
    - *Note* - Token is only valid if they are neither facing Lifetime expiry nor Timeout expiry. 
- **Why this design?:**
    - If we were to maintain only one token per user, the backend would have to communicate with the database for authorising every request which is painful and not scalable.
    - Thus, the database is gonna store a refresh token, which persists for longer and the server will store the access token which is attached to the refresh token. This access token has *one fixed expiry time*, which is Lifetime expiry i.e. with respect to when it was created. 
    - This helps us to scale by a lot, because of reduced database access for authentication. If server cache is cold, then all access tokens are invalidated by default but refresh token stays intact to issue new access tokens.
    - This also helps the user to stay logged in. They don't have to keep on signing in all the time.

*Note* - The refresh token must be invalidated after the user has signed out regardless of Timeout or Lifetime.

---

## **What the backend expects**

The backend expects:
- **email** or **handle** (string) field name -> **identifier**
- **password** (string)


Example request body:
```json
{
  "identifier": "user@example.com" or "handle",
  "password": "StrongPassword123",
}

```

## What the backend returns

### On successful signin (**HTTP 200 - Ok**):

**Headers**:

*Brief Explanation*:

*Set-Cookie* means the server tells the browser to store this data for future access or refresh.

Content to store as the cookie:
- *refresh token* value itself which is stored in the backend database

- *HttpOnly* disallows users from accessing this cookie via Client side scripts. Prevents *Cross-Site Scripting* (XSS) attacks i.e. even if the hacker runs malicious code on your page, they cannot see this cookie data.

- *Secure* - Means that cookie is only sent over encrypted connections (HTTPS) to ensure safely against Man-in-the-Middle attacks

- *SameSite* - This is one operating mode out of `Strict`, `Lax` and `None`.
  - *Strict* - This mode allows `GET` and `POST` with the cookie attached only if the request originates from the same site.
  - *Lax* - This mode allows `POST` with the cookie attached only if the request originates from the same site however, `GET` method is allowed via a request to this site originating from another site. In other words, Lax allows data to be given by the server but no data can be modified or presented to the server in this scenario.
  - *None* - This mode allows both `GET` and `POST` methods to be originating from another flag and requries the Secure flag to be set.

  *Note* - Strict and Lax modes help prevent **Cross-Site Request Forgery** (CSRF) attacks.

- *Path* - This is a final check making sure that this cookie is only to be attached to requests to this path or sub-paths. For example, if `PATH = /api/v1/auth/refresh` then `/api/v1/auth/login endpoint` would not have the cookie attached but `/api/v1/auth/refresh` or `/api/v1/auth/refresh/auto` will have the cookie attached.

```
Set-Cookie: refresh_token=...;
HttpOnly;
Secure;
SameSite=Lax;
Path=/api/v1/auth
```

### Body:
```json
{
    "id": (integer/string based on our backend design),
    "type": 0 or 1 based on type of user (or some sub category based on protocol that is subject to change at the moment),
    "access_token": short lived access token (string),
    "expires_in": natural number (seconds)
}
```

<!--- I saw that apparantly in JWT style tokens expiry is embedded into the access token itself so if we are taking that format then this needs to be changed. MrBottleTree -->

## On unsuccessful signin (missing fields) **(HTTP 400 - Bad Request)**

```json
{
    "error": "Missing fields",
    "details":{
        //maybe include some details for frontend to know whats up
    }
}
```

## On unsuccessful signin (incorrect ```identifier``` - ```password``` pair) **(HTTP 401 - Unauthorized)**

```json
{
    "error": "identifier and password does not match any account",
    "details":{
        //if any, mostly none, Future work.
    }
}
```

## **All other methods will return ***(HTTP 405 - Method Not Allowed)***