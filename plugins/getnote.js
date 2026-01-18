const db = require('../database/db')

module.exports = {
  command: "notes",
  execute: async (sock, msg, args, { from, sender }) => {
    try {
      // Get all notes for this group/chat from Supabase
      const { data: notes, error } = await db
        .from('notes')
        .select('note_name, created_at, note_content')
        .eq('group_id', from)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil daftar notes." })
        return
      }

      if (!notes || notes.length === 0) {
        await sock.sendMessage(from, { 
          text: "📝 Belum ada notes tersimpan.\n\nGunakan !save untuk menyimpan pesan sebagai notes." 
        })
        return
      }

      let text = `📝 *Daftar Notes*\n\n\`\`\`\n`
      
      notes.forEach((note, index) => {
        const date = new Date(note.created_at)
        const dateStr = date.toLocaleDateString('id-ID')
        const preview = note.note_content.substring(0, 30)
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
