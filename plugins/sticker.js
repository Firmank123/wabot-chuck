const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  command: "sticker",
  execute: async (sock, msg, args, { from, sender, isGroup }) => {
    try {
      // msg is already the message object (not msg.messages[0])
      
      // Check if message has image or video (GIF is treated as video by WhatsApp)
      const imageMessage = msg.message?.imageMessage || 
                          msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      
      const videoMessage = msg.message?.videoMessage || 
                          msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage

      if (!imageMessage && !videoMessage) {
        await sock.sendMessage(from, { 
          text: "❌ Kirim atau reply gambar/GIF dengan command !sticker untuk mengubahnya menjadi stiker!" 
        })
        return
      }

      // Determine if it's animated (video/GIF)
      const isAnimated = !!videoMessage

      // Send processing message
      await sock.sendMessage(from, { 
        text: isAnimated ? "⏳ Sedang memproses GIF menjadi stiker animasi..." : "⏳ Sedang memproses gambar menjadi stiker..." 
      })

      // Download the media
      let buffer
      if (imageMessage) {
        if (msg.message?.imageMessage) {
          buffer = await downloadMediaMessage(msg, 'buffer', {})
        } else {
          const quotedMsg = {
            message: { imageMessage: imageMessage }
          }
          buffer = await downloadMediaMessage(quotedMsg, 'buffer', {})
        }

        // Process image to WebP format for sticker
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
      } else if (videoMessage) {
        // Handle animated sticker (video/GIF)
        if (msg.message?.videoMessage) {
          buffer = await downloadMediaMessage(msg, 'buffer', {})
        } else {
          const quotedMsg = {
            message: { videoMessage: videoMessage }
          }
          buffer = await downloadMediaMessage(quotedMsg, 'buffer', {})
        }

        // Create temporary files
        const tempInput = `./temp_${Date.now()}.mp4`
        const tempOutput = `./temp_${Date.now()}.webp`

        try {
          // Write buffer to temp file
          fs.writeFileSync(tempInput, buffer)

          // Convert to animated WebP using fluent-ffmpeg
          await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
              .outputOptions([
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-t', '5',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
              ])
              .toFormat('webp')
              .save(tempOutput)
              .on('end', resolve)
              .on('error', reject)
          })

          // Read the output file
          const stickerBuffer = fs.readFileSync(tempOutput)

          // Send as sticker
          await sock.sendMessage(from, {
            sticker: stickerBuffer
          })

          // Clean up temp files
          fs.unlinkSync(tempInput)
          fs.unlinkSync(tempOutput)
        } catch (ffmpegError) {
          // Clean up on error
          if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput)
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput)
          throw ffmpegError
        }
      }

    } catch (error) {
      console.error('Error in sticker plugin:', error)
      await sock.sendMessage(from, { 
        text: "❌ Terjadi kesalahan saat membuat stiker. Pastikan file yang dikirim adalah gambar/GIF yang valid!"
      })
    }
  }
}
