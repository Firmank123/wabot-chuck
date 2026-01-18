const Database = require("better-sqlite3")
const db = new Database("./database/data.sqlite")

db.prepare(`
CREATE TABLE IF NOT EXISTS warns (
  id TEXT,
  group_id TEXT,
  count INTEGER
)
`).run()

try {
  const tableInfo = db.prepare(`PRAGMA table_info(notes)`).all()
  const hasOldSchema = tableInfo.some(col => col.name === 'user_id')
  
  if (hasOldSchema) {
    console.log('Migrating notes table from user_id to group_id...')
    db.prepare(`DROP TABLE notes`).run()
  }
} catch (err) {
  // Table doesn't exist yet, which is fine
}

db.prepare(`
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  note_name TEXT NOT NULL,
  note_content TEXT NOT NULL,
  created_at INTEGER NOT NULL
)
`).run()

module.exports = db
