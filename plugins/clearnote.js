const db = require('../database/db')

module.exports = {
  command: "clear",
  execute: async (sock, msg, args, { from, sender, isGroup }) => {
    try {
      // Check if in group
      if (!isGroup) {
        await sock.sendMessage(from, { text: "❌ Command ini hanya bisa digunakan di grup!" })
        return
      }

      // Check if user is admin
      const groupMetadata = await sock.groupMetadata(from)
      const participants = groupMetadata.participants
      const isAdmin = participants.find(p => p.id === sender)?.admin
      
      if (!isAdmin) {
        await sock.sendMessage(from, { text: "❌ Hanya admin yang dapat menghapus notes!" })
        return
      }

      // Get note name
      const noteName = args.join(" ").trim()
      
      if (!noteName) {
        await sock.sendMessage(from, { text: "❌ Berikan nama notes yang ingin dihapus!\n\nContoh: !clear catatan-penting" })
        return
      }

      // Check if note exists in Supabase
      const { data: existingNotes, error: checkError } = await db
        .from('notes')
        .select('id')
        .eq('group_id', from)
        .eq('note_name', noteName)
        .limit(1)

      if (checkError) {
        console.error('Supabase error:', checkError)
        await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat memeriksa notes." })
        return
      }
      
      if (!existingNotes || existingNotes.length === 0) {
        await sock.sendMessage(from, { 
          text: `❌ Notes "${noteName}" tidak ditemukan.\n\nGunakan !notes untuk melihat daftar notes.` 
        })
        return
      }

      // Delete the note from Supabase
      const { error: deleteError } = await db
        .from('notes')
        .delete()
        .eq('group_id', from)
        .eq('note_name', noteName)

      if (deleteError) {
        console.error('Supabase error:', deleteError)
        await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menghapus notes." })
        return
      }

      await sock.sendMessage(from, { 
        text: `✅ Notes "${noteName}" berhasil dihapus!` 
      })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menghapus notes." })
    }
  }
}
