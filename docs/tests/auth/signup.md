## Overview

The ```tests/auth/signup.test.js``` file has the following testcases
- Simple user signup:
    - This testcase creates a simple user by creating a username using date time and nanoseconds (to ensure that this username is unique) and checks if the response status code is (HTTP 201 - Created) and if the server responded with a user id.
- Simple admin signup:
    - Very similar to the user signup, except that, the type is set to 1 (admin type). Same things are expected in the testcase.
