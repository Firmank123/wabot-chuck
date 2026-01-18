const config = require("../config")

module.exports = async (sock, msg) => {
  try {
    const m = msg.messages[0]
    if (!m.message) return

    const from = m.key.remoteJid
    const isGroup = from.endsWith("@g.us")
    const sender = m.key.participant || from

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      ""

    if (!body.startsWith(config.prefix)) return

    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    console.log(`Command: ${command} from ${sender}`)

    const plugins = require("../plugins")
    for (const plugin of plugins) {
      if (plugin.command === command) {
        await plugin.execute(sock, m, args, { from, sender, isGroup })
      }
    }
  } catch (err) {
    console.error(err)
  }
}
