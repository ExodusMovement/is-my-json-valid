const tape = require('tape')
const fs = require('fs')
const path = require('path')
const validator = require('../')

const unsupported = new Set([
  // Directories
  'optional',
  // Files
  'definitions.json',
  'refRemote.json',
  'ref.json',
  // Blocks
  'format.json/validation of IP addresses',
  'format.json/validation of IPv6 addresses',
  'items.json/items and subitems',
  // Specific tests
  'items.json/an array of schemas for items/JavaScript pseudo-array is valid',
  'maxLength.json/maxLength validation/two supplementary Unicode code points is long enough',
  'minLength.json/minLength validation/one supplementary Unicode code point is not long enough',
])

const schemaDir = path.join(__dirname, '/json-schema/draft4')

function processTestDir(subdir = '') {
  const dir = path.join(schemaDir, subdir)
  for (const file of fs.readdirSync(dir)) {
    const sub = path.join(subdir, file) // relative to schemaDir
    if (unsupported.has(sub)) continue
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(schemaDir, sub))
      processTest(sub, JSON.parse(content))
    } else {
      // assume it's a dir and let it fail otherwise
      processTestDir(sub)
    }
  }
}

function processTest(id, file) {
  for (const block of file) {
    if (unsupported.has(`${id}/${block.description}`)) continue
    tape(`json-schema-test-suite ${id}/${block.description}`, (t) => {
      const validate = validator(block.schema)
      for (const test of block.tests) {
        if (unsupported.has(`${id}/${block.description}/${test.description}`)) continue
        t.same(validate(test.data), test.valid, test.description)
      }
      t.end()
    })
  }
}

processTestDir()
