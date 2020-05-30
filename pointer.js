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

function resolveReference(root, additionalSchemas, ptr, basePath = '') {
  const results = []

  const full = joinPath(basePath, ptr)
  if (ptr !== full) results.push(...resolveReference(root, additionalSchemas, full))

  const visit = (sub, path) => {
    if (!sub || typeof sub !== 'object') return
    const id = sub.$id || sub.id
    if (id && typeof id === 'string') {
      path = joinPath(path, id)
      if (path === full) results.push([sub, root])
      else if (id === ptr) {
        results.push([sub, root])
      }
    }
    for (const k of Object.keys(sub)) visit(sub[k], path)
  }
  visit(root, '')

  // TODO: fix code below

  ptr = ptr.replace(/^#/, '')
  ptr = ptr.replace(/\/$/, '')

  try {
    const res = get(root, decodeURI(ptr))
    if (res !== undefined) results.push([res, root])
  } catch (err) {
    // do nothing
  }

  const end = ptr.indexOf('#')
  // external reference
  if (end === 0 || end === -1) {
    const additional = additionalSchemas[ptr]
    results.push([additional, additional])
  } else {
    const ext = ptr.slice(0, end)
    const fragment = ptr.slice(end).replace(/^#/, '')
    try {
      const additional = additionalSchemas[ext]
      const res = get(additional, fragment)
      if (res !== undefined) results.push([res, additional])
    } catch (err) {
      // do nothing
    }
  }

  return results
}

module.exports = { get, joinPath, resolveReference }
