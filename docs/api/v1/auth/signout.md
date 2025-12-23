so here,
the frontend guy does not add ANYTHING to the body, the frontend guy should only mess with the headers.

the headers of the request must contain the access token and the cokies will anyways stay by default.

the cookie that is needed by the backend is refresh token.

so imagine this: refresh tokens are attached one per signed in device, once the device signs out, the refresh token also should get invalidated... in order to maintain the authenticity, there is an access token attached to the refresh token that has a very short life span (in our case, 15 mins).

so the frontend should send both the access token and the refresh token.
if the frontend does not have the access token, that is okay because the backend only cares

if the frontend does not have the refresh token, then the frontend's state is corrupted if frontend assumes that the user is logged in... the frontend should follow strict expiry timings given in the refresh and access tokens else it will end up in corrupted state.

so here is what the frontend should send formally to the backend at the endpoint: /api/v1/auth/signout
headers: Authorization: Bearer <access_token>
cookies: default http only cookies (managed by browser, frontend does not have to do jack)

response from server can be:

upon success:
- server returns (HTTP 204 - No Content)

unsuccessful events (missing fields like refresh token or access token):
- server returns (HTTP 401 - Unauthorized)

unsuccessful events (incorrect/corrupted fields):
- server returns (HTTP 400 - Bad Request)

