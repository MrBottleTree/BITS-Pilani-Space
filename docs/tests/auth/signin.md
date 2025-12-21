## Overview

The ```tests/auth/signin.test.js``` file has the following testcases
- Successful signin testcases:
    - Simple user signin:
        - This testcase creates a simple user by creating a username using date time and nanoseconds (to ensure that this username is unique) and checks if the response status code is (HTTP 201 - Created) and if the server responded with a user id. And signs the user in and checks status codes.
    - Simple admin signin:
        - Very similar to the user signin, except that, the type is set to 1 (admin type). Same things are expected in the testcase.

- Unsuccessful signin testcases:
    - signin with incorrect password/identifier pair fails
    - signin with missing fields fails