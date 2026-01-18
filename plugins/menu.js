module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
📝 *Commands Group:*
!save <nama-notes> - Simpan pesan/media sebagai notes (reply pesan/gambar/video/file)
!notes - Lihat daftar notes
#<nama-notes> - Tampilkan notes
!clear <nama-notes> - Hapus notes

🎨 *Commands Sticker:*
!sticker - Kirim atau reply gambar/gif untuk mengubahnya menjadi stiker
!sticker-tele <link> - Import sticker pack dari Telegram ke WhatsApp

    `
    await sock.sendMessage(from, { text })
  }
}
