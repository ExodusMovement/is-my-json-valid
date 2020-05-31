'use strict'

function untilde(string) {
  if (!string.includes('~')) return string
  return string.replace(/~[01]/g, (match) => {
    switch (match) {
      case '~1':
        return '/'
      case '~0':
        return '~'
    }
    throw new Error(`Invalid tilde escape: ${match}`)
  })
}

function get(obj, pointer) {
  if (typeof obj !== 'object') throw new Error('Invalid input object')
  if (typeof pointer !== 'string') throw new Error('Invalid JSON pointer')
  const parts = pointer.split('/')
  if (parts.shift() !== '') throw new Error('Invalid JSON pointer')
  if (parts.length === 0) return obj

  for (const part of parts) {
    if (typeof part !== 'string') throw new Error('Invalid JSON pointer')
    const prop = untilde(part)
    if (typeof obj !== 'object') return undefined
    if (!obj.hasOwnProperty(prop)) return undefined
    obj = obj[prop]
  }
  return obj
}

function joinPath(base, sub) {
  if (typeof base !== 'string' || typeof sub !== 'string') throw new Error('Unexpected path!')
  if (sub.length === 0) return base
  base = base.replace(/#.*/, '')
  if (sub.startsWith('#')) return `${base}${sub}`
  if (!base.includes('/') || sub.replace(/#.*/, '').includes('://')) return sub
  if (sub.startsWith('/')) throw new Error('Unsupported yet')
  return `${base.replace(/\/?[^/]*$/, '')}/${sub}`
}

function resolveReference(root, additionalSchemas, ptr) {
  const results = []

  const [main, hash = ''] = ptr.split('#')
  const local = decodeURI(hash).replace(/\/$/, '')

  // Find in self by id path
  const visit = (sub, path) => {
    if (!sub || typeof sub !== 'object') return
    const id = sub.$id || sub.id
    if (id && typeof id === 'string') {
      path = joinPath(path, id)
      if (path === ptr || (path === main && local === '')) {
        results.push([sub, root])
      } else if (path === main && local[0] === '/') {
        const res = get(sub, local)
        if (res !== undefined) results.push([res, root])
      }
    }
    for (const k of Object.keys(sub)) visit(sub[k], path)
  }
  visit(root, '')

  // Find in self by pointer
  if (main === '' && (local[0] === '/' || local === '')) {
    const res = get(root, local)
    if (res !== undefined) results.push([res, root])
  }

  // Find in additional schemas
  if (additionalSchemas.hasOwnProperty(main))
    results.push(...resolveReference(additionalSchemas[main], additionalSchemas, `#${hash}`))

  return results
}

module.exports = { get, joinPath, resolveReference }
