# How to Run

The following commands can be run via MakeFile, once the user has changed directory to the bps-backend directory inside the root folder of this project. Basically `SOME_PATH/BITS-PILANI-SPACE/bps-backend` is where your bash/terminal points to.

```bash
make run          # start everything
make stop         # stop containers
make down         # remove containers (keep data)
make migrate      # run prisma migrate dev
make reset        # rebuild containers, keep DB
make hard-reset   # wipe DB + rebuild + migrate
make logs         # follow logs
```

Further explanation pending review ~ KnightFury1102
