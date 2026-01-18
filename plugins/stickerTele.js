const axios = require('axios')
const sharp = require('sharp')

module.exports = {
  command: "sticker-tele",
  execute: async (sock, msg, args, { from, sender, isGroup }) => {
    try {
      // Get Telegram sticker pack link
      const telegramLink = args.join(" ").trim()
      
      if (!telegramLink) {
        await sock.sendMessage(from, { 
          text: "❌ Berikan link sticker pack Telegram!\n\nContoh: !sticker-tele https://t.me/addstickers/PackName\n\n⚠️ Note: Untuk menggunakan fitur ini, perlu Telegram Bot Token di config.\nTambahkan TELEGRAM_BOT_TOKEN di file .env" 
        })
        return
      }

      // Check if bot token is configured
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (!botToken) {
        await sock.sendMessage(from, { 
          text: `❌ Telegram Bot Token belum dikonfigurasi!\n\n📝 Cara setup:\n1. Chat @BotFather di Telegram\n2. Buat bot baru dengan /newbot\n3. Copy token yang diberikan\n4. Tambahkan ke file .env:\nTELEGRAM_BOT_TOKEN=your_token_here\n5. Restart bot` 
        })
        return
      }

      // Extract pack name from link
      let packName = ''
      if (telegramLink.includes('t.me/addstickers/')) {
        packName = telegramLink.split('t.me/addstickers/')[1].split('?')[0].split('/')[0]
      } else if (telegramLink.includes('telegram.me/addstickers/')) {
        packName = telegramLink.split('telegram.me/addstickers/')[1].split('?')[0].split('/')[0]
      } else {
        // Assume it's just the pack name
        packName = telegramLink.replace(/[^a-zA-Z0-9_]/g, '')
      }

      if (!packName) {
        await sock.sendMessage(from, { 
          text: "❌ Link tidak valid! Format yang benar:\nhttps://t.me/addstickers/PackName" 
        })
        return
      }

      await sock.sendMessage(from, { 
        text: `⏳ Mengambil sticker pack "${packName}" dari Telegram...\nMohon tunggu...` 
      })

      try {
        // Get sticker pack using Telegram Bot API
        const apiUrl = `https://api.telegram.org/bot${botToken}/getStickerSet?name=${packName}`
        const response = await axios.get(apiUrl)

        if (!response.data.ok) {
          throw new Error(response.data.description || 'Failed to get sticker set')
        }

        const stickerSet = response.data.result
        const stickers = stickerSet.stickers

        console.log(`Found ${stickers.length} stickers in pack: ${stickerSet.title}`)

        if (stickers.length === 0) {
          await sock.sendMessage(from, { 
            text: `❌ Sticker pack "${packName}" kosong atau tidak valid.` 
          })
          return
        }

        await sock.sendMessage(from, { 
          text: `✅ Ditemukan ${stickers.length} sticker dari pack "${stickerSet.title}"!\n⏳ Sedang mengkonversi dan mengirim...` 
        })

        // Filter only static stickers (not animated/video)
        const staticStickers = stickers.filter(s => !s.is_animated && !s.is_video)
        
        if (staticStickers.length === 0) {
          await sock.sendMessage(from, { 
            text: `❌ Pack ini hanya berisi sticker animasi/video yang tidak didukung.` 
          })
          return
        }

        // Send all stickers without limit
        const totalToSend = staticStickers.length
        
        if (totalToSend > 50) {
          await sock.sendMessage(from, { 
            text: `⚠️ Pack ini berisi ${totalToSend} sticker statis.\nProses akan memakan waktu ~${Math.ceil(totalToSend / 2)} detik.\n\n⏳ Memulai download dan konversi...` 
          })
        }

        let successCount = 0
        const failedCount = []

        // Download and convert all stickers in parallel batches
        const batchSize = 5
        for (let i = 0; i < totalToSend; i += batchSize) {
          const batch = staticStickers.slice(i, Math.min(i + batchSize, totalToSend))
          
          const batchPromises = batch.map(async (sticker, idx) => {
            const stickerIndex = i + idx
            try {
              // Get file info
              const fileResponse = await axios.get(
                `https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`
              )

              if (!fileResponse.data.ok) {
                throw new Error('Failed to get file info')
              }

              const filePath = fileResponse.data.result.file_path
              const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`

              // Download sticker file
              const stickerResponse = await axios.get(fileUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
              })

              const buffer = Buffer.from(stickerResponse.data)

              // Convert to WhatsApp sticker format
              const stickerBuffer = await sharp(buffer)
                .resize(512, 512, {
                  fit: 'contain',
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 95 })
                .toBuffer()

              return { success: true, buffer: stickerBuffer, index: stickerIndex }
            } catch (error) {
              console.error(`Error processing sticker ${stickerIndex + 1}:`, error.message)
              return { success: false, index: stickerIndex }
            }
          })

          const results = await Promise.all(batchPromises)
          
          // Send successful stickers
          for (const result of results) {
            if (result.success) {
              try {
                await sock.sendMessage(from, {
                  sticker: result.buffer
                })
                successCount++
              } catch (sendError) {
                console.error(`Error sending sticker ${result.index + 1}:`, sendError.message)
                failedCount.push(result.index + 1)
              }
              // Small delay between sends
              await new Promise(resolve => setTimeout(resolve, 300))
            } else {
              failedCount.push(result.index + 1)
            }
          }

          // Progress update every batch
          if (i + batchSize < totalToSend) {
            console.log(`Progress: ${Math.min(i + batchSize, totalToSend)}/${totalToSend} stickers processed`)
          }
        }

        if (successCount > 0) {
          const totalStatic = staticStickers.length
          const animated = stickers.length - staticStickers.length
          let message = `✅ Berhasil mengirim ${successCount} sticker!`
          
          if (failedCount.length > 0) {
            message += `\n❌ ${failedCount.length} sticker gagal.`
          }
          
          if (animated > 0) {
            message += `\n\n📝 ${animated} sticker animasi dilewati (hanya statis yang didukung).`
          }
          
          message += `\n\n💡 Tip: Save sticker favorit dengan long press > Add to favorites di WhatsApp!`
          
          await sock.sendMessage(from, { text: message })
        } else {
          await sock.sendMessage(from, { 
            text: `❌ Gagal mengirim sticker. Pack mungkin hanya berisi sticker animasi.` 
          })
        }

      } catch (apiError) {
        console.error('Error fetching Telegram stickers:', apiError.message)
        
        let errorMsg = `❌ Gagal mengambil sticker pack dari Telegram.\n\n`
        
        if (apiError.response?.data?.description) {
          errorMsg += `Error: ${apiError.response.data.description}\n\n`
        }
        
        errorMsg += `Kemungkinan penyebab:\n1. Nama pack salah: "${packName}"\n2. Pack tidak ada atau private\n3. Bot token tidak valid\n\nCoba pack lain atau periksa konfigurasi.`
        
        await sock.sendMessage(from, { text: errorMsg })
      }

    } catch (error) {
      console.error('Error in sticker-tele plugin:', error)
      await sock.sendMessage(from, { 
        text: "❌ Terjadi kesalahan saat memproses sticker pack Telegram!" 
      })
    }
  }
}
