# How to Run

The following commands can be run via MakeFile, once the user has changed directory to the bps-backend directory inside the root folder of this project. Basically `SOME_PATH/BITS-PILANI-SPACE/bps-backend` is where your bash/terminal points to.

```bash
make help         # Shows the make commands available and what they do.
make delete       # Stops the docker containers, removes them and deletes the docker volumes
make stop         # Stop the docker containers (like pause)
make start        # Starts the paused docker conatiners, using existing DB, [builds the containers if not already there]
make run          # Calls delete->start and then applies migrations as well.
make test         # Calls run and then runs the tests from the ./tests directory
```

Further explanation pending review ~ KnightFury1102
