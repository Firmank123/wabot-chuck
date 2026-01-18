module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
📝 *Notes Commands:*
!save <nama-notes> - Simpan pesan/media sebagai notes (reply pesan/gambar/video/file)
!notes - Lihat daftar notes
#<nama-notes> - Tampilkan notes
!clear <nama-notes> - Hapus notes

💡 *Fitur Baru:*
✅ Simpan gambar + caption
✅ Simpan video + caption
✅ Simpan file/dokumen + caption
✅ Simpan teks biasa

📌 *Contoh:*
- Reply gambar: !save foto-penting
- Panggil: #foto-penting
    `
    await sock.sendMessage(from, { text })
  }
}
