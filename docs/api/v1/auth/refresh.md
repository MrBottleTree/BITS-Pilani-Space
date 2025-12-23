this endpoint accepts a valid refresh token to generate a new access token

does not expect anything in the body or in the header, the cookies come automatically.

response from the server, 

on success (HTTP 200 - Ok)
```json
{
    "access_token": short lived access token (string),
    "expires_in": natural number (seconds)
}
```

upon failure if token is invalid (HTTP 401 - Unauthorized)

upon failure if token is absent (HTTP 400 - Bad Request)