const db = require('../database/db')

module.exports = {
  command: "save",
  execute: async (sock, msg, args, { from, sender }) => {
    try {
      // Check if message is a reply
      const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
      
      if (!quotedMessage) {
        await sock.sendMessage(from, { text: "❌ Reply pesan yang ingin disimpan sebagai notes!" })
        return
      }

      // Get note name
      const noteName = args.join(" ").trim()
      
      if (!noteName) {
        await sock.sendMessage(from, { text: "❌ Berikan nama untuk notes!\n\nContoh: !save catatan-penting" })
        return
      }

      // Get the content from quoted message
      const noteContent = quotedMessage.conversation || 
                         quotedMessage.extendedTextMessage?.text ||
                         quotedMessage.imageMessage?.caption ||
                         quotedMessage.videoMessage?.caption ||
                         "Media message"

      // Save to database
      const stmt = db.prepare(`
        INSERT INTO notes (group_id, note_name, note_content, created_at)
        VALUES (?, ?, ?, ?)
      `)
      
      stmt.run(from, noteName, noteContent, Date.now())

      await sock.sendMessage(from, { 
        text: `✅ Notes berhasil disimpan!\n\n📝 Nama: ${noteName}\n\nGunakan #${noteName} untuk melihat notes ini.` 
      })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menyimpan notes." })
    }
  }
}
