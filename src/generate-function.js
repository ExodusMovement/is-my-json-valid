const jaystring = require('./jaystring')

const INDENT_START = /[{[]/
const INDENT_END = /[}\]]/

const format = (fmt, ...args) => {
  const res = fmt.replace(/%[%dsj]/g, (match) => {
    if (match === '%%') return '%'
    if (args.length === 0) throw new Error('Unexpected arguments count')
    const val = args.shift()
    switch (match) {
      case '%d':
        if (typeof val === 'number') return val
        throw new Error('Expected a number')
      case '%s':
        if (typeof val === 'string') return val
        throw new Error('Expected a string')
      case '%j':
        return JSON.stringify(val)
    }
    throw new Error(`Unreachable`)
  })
  if (args.length !== 0) throw new Error('Unexpected arguments count')
  return res
}

module.exports = () => {
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

  return {
    write(fmt, ...args) {
      if (typeof fmt !== 'string') throw new Error('Format must be a string!')
      if (fmt.includes('\n')) throw new Error('Only single lines are supported')
      pushLine(args.length > 0 ? format(fmt, ...args) : fmt)
    },

    size() {
      return lines.length
    },

    block(fmt, args, close, writeBody) {
      const oldIndent = indent
      this.write(fmt, ...args)
      const length = lines.length
      writeBody()
      if (length === lines.length) {
        // no lines inside block, unwind the block
        lines.pop()
        indent = oldIndent
        return
      }
      this.write(close)
    },

    makeRawSource() {
      return lines.join('\n')
    },

    makeModule(scope = {}) {
      const scopeSource = Object.entries(scope)
        .map(([key, value]) => `const ${key} = ${jaystring(value)};`)
        .join('\n')
      return `(function() {\n${scopeSource}\nreturn (${this.makeRawSource()})})();`
    },

    makeFunction(scope = {}) {
      const src = `return (${this.makeRawSource()})`
      const keys = Object.keys(scope)
      const vals = keys.map((key) => scope[key])
      // eslint-disable-next-line no-new-func
      return Function(...keys, src)(...vals)
    },
  }
}
