const db = require('../database/db')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')

module.exports = {
  command: "save",
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
        await sock.sendMessage(from, { text: "❌ Hanya admin yang dapat menyimpan notes!" })
        return
      }

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

      // Prepare note data
      let noteData = {
        group_id: from,
        note_name: noteName,
        created_at: new Date().toISOString()
      }

      // Get the content from quoted message
      const textContent = quotedMessage.conversation || 
                         quotedMessage.extendedTextMessage?.text

      // Handle different message types
      if (quotedMessage.imageMessage) {
        // Image message
        const caption = quotedMessage.imageMessage.caption || ""
        noteData.media_type = 'image'
        noteData.media_mimetype = quotedMessage.imageMessage.mimetype
        noteData.caption = caption
        noteData.note_content = caption || "📷 Gambar"
        
        // Download and convert to base64
        try {
          const buffer = await downloadMediaMessage(
            { message: { imageMessage: quotedMessage.imageMessage } },
            'buffer',
            {},
            { 
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
          noteData.media_buffer = buffer.toString('base64')
        } catch (err) {
          console.error('Error downloading image:', err)
        }
      } else if (quotedMessage.videoMessage) {
        // Video message
        const caption = quotedMessage.videoMessage.caption || ""
        noteData.media_type = 'video'
        noteData.media_mimetype = quotedMessage.videoMessage.mimetype
        noteData.caption = caption
        noteData.note_content = caption || "🎥 Video"
        
        // Download and convert to base64
        try {
          const buffer = await downloadMediaMessage(
            { message: { videoMessage: quotedMessage.videoMessage } },
            'buffer',
            {},
            { 
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
          noteData.media_buffer = buffer.toString('base64')
        } catch (err) {
          console.error('Error downloading video:', err)
        }
      } else if (quotedMessage.documentMessage) {
        // Document/File message
        const fileName = quotedMessage.documentMessage.fileName || "file"
        const caption = quotedMessage.documentMessage.caption || ""
        noteData.media_type = 'document'
        noteData.media_mimetype = quotedMessage.documentMessage.mimetype
        noteData.caption = caption || fileName
        noteData.note_content = caption || `📎 ${fileName}`
        
        // Download and convert to base64
        try {
          const buffer = await downloadMediaMessage(
            { message: { documentMessage: quotedMessage.documentMessage } },
            'buffer',
            {},
            { 
              logger: console,
              reuploadRequest: sock.updateMediaMessage
            }
          )
          noteData.media_buffer = buffer.toString('base64')
        } catch (err) {
          console.error('Error downloading document:', err)
        }
      } else {
        // Text only message
        noteData.note_content = textContent || "Pesan kosong"
      }

      // Save to Supabase
      const { data, error } = await db
        .from('notes')
        .insert([noteData])

      if (error) {
        console.error('Supabase error:', error)
        await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menyimpan notes." })
        return
      }

      await sock.sendMessage(from, { 
        text: `✅ Notes berhasil disimpan!\n\n📝 Nama: ${noteName}\n\nGunakan #${noteName} untuk melihat notes ini.` 
      })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat menyimpan notes." })
    }
  }
}
