module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
!menu - Tampilkan menu
!save <nama-notes> - Simpan pesan sebagai notes (reply pesan)
!notes - Lihat daftar notes
#<nama-notes> - Tampilkan notes
!clear <nama-notes> - Hapus notes
    `
    await sock.sendMessage(from, { text })
  }
}
