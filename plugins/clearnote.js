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

      // Check if note exists
      const checkStmt = db.prepare(`
        SELECT id, note_name
        FROM notes
        WHERE group_id = ? AND note_name = ?
      `)
      
      const note = checkStmt.get(from, noteName)
      
      if (!note) {
        await sock.sendMessage(from, { 
          text: `❌ Notes "${noteName}" tidak ditemukan.\n\nGunakan !notes untuk melihat daftar notes.` 
        })
        return
      }

      // Delete the note
      const deleteStmt = db.prepare(`
        DELETE FROM notes
        WHERE group_id = ? AND note_name = ?
      `)
      
      deleteStmt.run(from, noteName)

      await sock.sendMessage(from, { 
        text: `✅ Notes "${noteName}" berhasil dihapus!` 
      })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menghapus notes." })
    }
  }
}
