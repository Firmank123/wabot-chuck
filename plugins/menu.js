module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
⚠️ *PENTING:*
Bot ini HANYA dapat digunakan di GRUP agar tidak kebanned!
Tambahkan bot ke grup terlebih dahulu sebelum menggunakan command.

📝 *Commands Group:*
!save <nama-notes> - Simpan pesan/media sebagai notes (reply pesan/gambar/video/file)
!notes - Lihat daftar notes
#<nama-notes> - Tampilkan notes
!clear <nama-notes> - Hapus notes

🎨 *Commands Sticker:*
!sticker - Kirim atau reply gambar/gif untuk mengubahnya menjadi stiker
!sticker-tele <link> - Import sticker pack dari Telegram ke WhatsApp

💡 *Cara Penggunaan:*
1. Tambahkan bot ke grup Anda
2. Ketik !menu di grup untuk melihat command
3. Gunakan command sesuai kebutuhan

    `
    await sock.sendMessage(from, { text })
  }
}
