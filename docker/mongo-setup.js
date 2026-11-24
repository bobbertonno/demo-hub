// Idempotent: safe to run on every `docker compose up`.
try {
  rs.status()
} catch {
  rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongod:27017' }] })
}

for (let i = 0; i < 60 && !db.hello().isWritablePrimary; i++) sleep(1000)

const admin = db.getSiblingDB('admin')
const password = process.env.MONGOT_PASSWORD
if (admin.getUser('mongotUser')) {
  admin.updateUser('mongotUser', { pwd: password })
} else {
  admin.createUser({ user: 'mongotUser', pwd: password, roles: [{ role: 'searchCoordinator', db: 'admin' }] })
}
print('replica set and mongot user ready')
