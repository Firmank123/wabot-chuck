const db = require('../database/db')

module.exports = {
  command: "notes",
  execute: async (sock, msg, args, { from, sender }) => {
    try {
      // Get all notes for this group/chat
      const stmt = db.prepare(`
        SELECT note_name, created_at, SUBSTR(note_content, 1, 30) as preview
        FROM notes
        WHERE group_id = ?
        ORDER BY created_at DESC
      `)
      
      const notes = stmt.all(from)

      if (notes.length === 0) {
        await sock.sendMessage(from, { 
          text: "📝 Belum ada notes tersimpan.\n\nGunakan !save untuk menyimpan pesan sebagai notes." 
        })
        return
      }

      let text = `📝 *Daftar Notes*\n\n\`\`\`\n`
      
      notes.forEach((note, index) => {
        const date = new Date(note.created_at)
        const dateStr = date.toLocaleDateString('id-ID')
        text += `${index + 1}. #${note.note_name}\n`
      })

      text += `\`\`\`\nTotal: ${notes.length} notes\n\n`
      text += `Gunakan #<nama-notes> untuk melihat isi notes`

      await sock.sendMessage(from, { text })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil daftar notes." })
    }
  }
}
