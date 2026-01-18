const Database = require("better-sqlite3")
const db = new Database("./database/data.sqlite")

db.prepare(`
CREATE TABLE IF NOT EXISTS warns (
  id TEXT,
  group_id TEXT,
  count INTEGER
)
`).run()

module.exports = db
