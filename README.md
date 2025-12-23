inside ./bps-backend

make run          # start everything
make stop         # stop containers
make down         # remove containers (keep data)
make migrate      # run prisma migrate dev
make reset        # rebuild containers, keep DB
make hard-reset   # wipe DB + rebuild + migrate
make logs         # follow logs
