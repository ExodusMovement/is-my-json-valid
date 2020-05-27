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

const schemaDraftDir = path.join(__dirname, '/json-schema-draft4')

function processTestDir(subdir = '') {
  const dir = path.join(schemaDraftDir, subdir)
  for (const file of fs.readdirSync(dir)) {
    if (unsupported.has(path.join(subdir, file))) continue
    const content = fs.readFileSync(path.join(dir, file))
    processTest(JSON.parse(content))
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
