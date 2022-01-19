const generate = (n = 6) => {
  let chars = '1234567890abcdefghijklmnoprstuvyx'
  let code = ''
  for(let i = 0; i < n; i++) {
    code = code + chars[Math.floor(Math.random() * chars.length)]
  }

  return code.toUpperCase()
}

module.exports = { generate }