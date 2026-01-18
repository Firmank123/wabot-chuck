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
          .select('*')
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
          
          // Check if note has media
          if (note.media_type && note.media_buffer) {
            const buffer = Buffer.from(note.media_buffer, 'base64')
            
            if (note.media_type === 'image') {
              // Send image
              await sock.sendMessage(from, {
                image: buffer,
                caption: note.caption ? `📝 *Notes: ${noteName}*\n\n${note.caption}` : `📝 *Notes: ${noteName}*`,
                mimetype: note.media_mimetype
              })
            } else if (note.media_type === 'video') {
              // Send video
              await sock.sendMessage(from, {
                video: buffer,
                caption: note.caption ? `📝 *Notes: ${noteName}*\n\n${note.caption}` : `📝 *Notes: ${noteName}*`,
                mimetype: note.media_mimetype
              })
            } else if (note.media_type === 'document') {
              // Send document
              const fileName = note.caption || 'file'
              await sock.sendMessage(from, {
                document: buffer,
                mimetype: note.media_mimetype,
                fileName: fileName.startsWith('📎') ? fileName.slice(2).trim() : fileName,
                caption: note.caption ? `📝 *Notes: ${noteName}*\n\n${note.caption}` : `📝 *Notes: ${noteName}*`
              })
            }
          } else {
            // Text only note
            await sock.sendMessage(from, { 
              text: `📝 *Notes: ${noteName}*\n\n${note.note_content}\n` 
            })
          }
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
