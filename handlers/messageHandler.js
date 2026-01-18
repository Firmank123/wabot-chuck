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
        // Get note from Supabase
        const { data: notes, error } = await db
          .from('notes')
          .select('note_content, created_at')
          .eq('group_id', from)
          .eq('note_name', noteName)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('Supabase error:', error)
          await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil notes." })
          return
        }
        
        if (notes && notes.length > 0) {
          const note = notes[0]
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
