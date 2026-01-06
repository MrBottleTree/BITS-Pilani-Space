# Signup endpoint

> Takes in basic information (like name, email and password) of users and signs the user in.

**URL:** `[POST] /auth/signup`

## Request

**Headers:**
```Not required```

**Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | Real (may) name of the user |
| `email` | String | Yes | Email of the user |
| `password` | String | Yes | Password for this account |
| `role` | Enum(`USER`, ADMIN) | No | User role type |

**Request Body:**

```json
{
    name: "Vishrut Ramraj",
    email: "vishrut172@gmail.com",
    password: "Password@123",
    role: "ADMIN"
}
```
```NOTE: The role field will not be accepted in future updates```

**Response on success ```(HTTP Code 201: Created)```:**
```json
{
    message: "User created.",
    data: {
        user: {
            id: "<string>: ID of the user",
            handle: "<string>: Auto generated unique handle",
            role: "<string, enum>: USER or ADMIN",
            name: "<string>: Name of the user",
            email: "<string>: Email of the user"
        }
    }
}
```

**Response on failure:**
* ```(HTTP Code 400: Bad Request)```
    * Missing Fields
    * Wrong format on Fields
    * Fields not in favourable range of length
* ```(HTTP Code 409: Conflict)```
    * When user with atleast one unique fields exist