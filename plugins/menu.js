module.exports = {
  command: "menu",
  execute: async (sock, msg, args, { from }) => {
    const text = `
🤖 *wabot-chuck*
────────────────
!menu
!ping
!warn @user
!kick @user
!antilink on/off
!rules
    `
    await sock.sendMessage(from, { text })
  }
}
