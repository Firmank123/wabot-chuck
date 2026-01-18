const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')

module.exports = {
  command: "sticker",
  execute: async (sock, msg, args, { from, sender, isGroup }) => {
    try {
      // msg is already the message object (not msg.messages[0])
      
      // Check if message has image
      const imageMessage = msg.message?.imageMessage || 
                          msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

      if (!imageMessage) {
        await sock.sendMessage(from, { 
          text: "❌ Kirim atau reply gambar dengan command !sticker untuk mengubahnya menjadi stiker!" 
        })
        return
      }

      // Send processing message
      await sock.sendMessage(from, { 
        text: "⏳ Sedang memproses gambar menjadi stiker..." 
      })

      // Download the image
      let buffer
      if (msg.message?.imageMessage) {
        buffer = await downloadMediaMessage(msg, 'buffer', {})
      } else {
        // For quoted message
        const quotedMsg = {
          message: {
            imageMessage: imageMessage
          }
        }
        buffer = await downloadMediaMessage(quotedMsg, 'buffer', {})
      }

      // Process image to WebP format for sticker
      // WhatsApp stickers should be 512x512 max
      const stickerBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 95 })
        .toBuffer()

      // Send as sticker
      await sock.sendMessage(from, {
        sticker: stickerBuffer
      })

    } catch (error) {
      console.error('Error in sticker plugin:', error)
      await sock.sendMessage(from, { 
        text: "❌ Terjadi kesalahan saat membuat stiker. Pastikan file yang dikirim adalah gambar yang valid!" 
      })
    }
  }
}
