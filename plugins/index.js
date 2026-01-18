const fs = require("fs")
const path = require("path")

// Create a command map for O(1) lookup instead of O(n) loop
const commandMap = {}

const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".js") && f !== "index.js")

for (const file of files) {
  const plugin = require(path.join(__dirname, file))
  if (plugin.command) {
    commandMap[plugin.command] = plugin
  }
}

module.exports = commandMap
