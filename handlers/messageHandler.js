const config = require("../config")
const db = require("../database/db")

module.exports = async (sock, msg) => {
  try {
    const m = msg.messages[0]
    if (!m.message) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith("@g.us")
    const sender = m.key.participant || from

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      ""

    // Handle # prefix for notes
    if (body.startsWith("#")) {
      const noteName = body.slice(1).trim()
      
      if (noteName) {
        const stmt = db.prepare(`
          SELECT note_content, created_at
          FROM notes
          WHERE group_id = ? AND note_name = ?
          ORDER BY created_at DESC
          LIMIT 1
        `)
        
        const note = stmt.get(from, noteName)
        
        if (note) {
          const date = new Date(note.created_at)
          const dateStr = date.toLocaleString('id-ID')
          
          await sock.sendMessage(from, { 
            text: `📝 *Notes: ${noteName}*\n\n${note.note_content}\n` 
          })
        } else {
          await sock.sendMessage(from, { 
            text: `❌ Notes "${noteName}" tidak ditemukan.\n\nGunakan !notes untuk melihat daftar notes.` 
          })
        }
      }
      return
    }

    if (!body.startsWith(config.prefix)) return

    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    console.log(`Command: ${command} from ${sender}`)

    const plugins = require("../plugins")
    for (const plugin of plugins) {
      if (plugin.command === command) {
        await plugin.execute(sock, m, args, { from, sender, isGroup })
      }
    }
  } catch (err) {
    console.error(err)
  }
}
