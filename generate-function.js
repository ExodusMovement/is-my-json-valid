const { format: utilFormat } = require('util')
const jaystring = require('jaystring')

const INDENT_START = /[{[]/
const INDENT_END = /[}\]]/

const genfun = function() {
  const lines = []
  let indent = 0

  const push = (str) => {
    lines.push(' '.repeat(indent * 2) + str)
  }

  const pushLine = (line) => {
    if (INDENT_END.test(line.trim()[0])) indent--
    push(line)
    if (INDENT_START.test(line[line.length - 1])) indent++
  }

  const builder = {}

  builder.write = function(fmt, ...args) {
    if (typeof fmt !== 'string') throw new Error('Format must be a string!')
    if (args.length === 1 && fmt.indexOf('\n') > -1) {
      // multiple lines with no parameters, push them separately for correct indent
      const lines = fmt.trim().split('\n')
      for (const line of lines) {
        pushLine(line.trim())
      }
    } else {
      // format + parameters case
      pushLine(utilFormat(fmt, ...args))
    }
  }

  builder.toString = function() {
    return lines.join('\n')
  }

  builder.toModule = function(scope = {}) {
    const scopeSource = Object.entries(scope)
      .map(([key, value]) => `const ${key} = ${jaystring(value)};`)
      .join('\n')
    return `(function() {\n${scopeSource}\nreturn (${builder.toString()})})();`
  }

  builder.toFunction = function(scope = {}) {
    const src = `return (${builder.toString()})`
    const keys = Object.keys(scope)
    const vals = keys.map((key) => scope[key])
    return Function.apply(null, keys.concat(src)).apply(null, vals)
  }

  return builder
}

module.exports = genfun
