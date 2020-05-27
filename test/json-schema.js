const tape = require('tape')
const fs = require('fs')
const path = require('path')
const validator = require('../')

const unsupported = new Set([
  // Files
  'definitions.json',
  'refRemote.json',
  'ref.json',
])

const schemaDir = path.join(__dirname, '/json-schema-draft4')

function processTestDir(subdir = '') {
  const dir = path.join(schemaDir, subdir)
  for (const file of fs.readdirSync(dir)) {
    const sub = path.join(subdir, file) // relative to schemaDir
    if (unsupported.has(sub)) continue
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(schemaDir, sub))
      processTest(JSON.parse(content))
    } else {
      // assume it's a dir and let it fail otherwise
      processTestDir(sub)
    }
  }
}

function processTest(file) {
  for (const block of file) {
    if (unsupported.has(block.description)) continue
    tape(`json-schema-test-suite ${block.description}`, (t) => {
      const validate = validator(block.schema)
      for (const test of block.tests) {
        if (unsupported.has(test.description)) continue
        t.same(validate(test.data), test.valid, test.description)
      }
      t.end()
    })
  }
}

processTestDir()
