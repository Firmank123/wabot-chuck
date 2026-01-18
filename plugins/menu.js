module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
📝 *Notes Commands Group:*
!save <nama-notes> - Simpan pesan/media sebagai notes (reply pesan/gambar/video/file)
!notes - Lihat daftar notes
#<nama-notes> - Tampilkan notes
!clear <nama-notes> - Hapus notes

📝 *Notes Commands Umum:*
!sticker - Kirim atau reply gambar untuk mengubahnya menjadi stiker

    `
    await sock.sendMessage(from, { text })
  }
}
