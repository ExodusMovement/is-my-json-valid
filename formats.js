/**
 * NOTICE
 * 'regex' delibirately not supported due to potential DoS. Don't accept regexes from untrusted sources.
 * 'style' also delibirately removed
 */

module.exports = {
  'date-time': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}[tT ]\d{2}:\d{2}:\d{2}(?:\.\d+|)([zZ]|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-[0-9]{2}$/,
  time: /^\d{2}:\d{2}:\d{2}$/,
  email: (input) => input.indexOf('@') !== -1 && !/\s/.test(input),
  uri: /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/,
  color: /(#?([0-9A-Fa-f]{3,6})\b)|(aqua)|(black)|(blue)|(fuchsia)|(gray)|(green)|(lime)|(maroon)|(navy)|(olive)|(orange)|(purple)|(red)|(silver)|(teal)|(white)|(yellow)|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\))/,
  hostname: (input) => {
    if (!/^[a-zA-Z0-9.-]+$/.test(input)) return false
    const parts = input.split('.')
    return parts.every((part) =>
      /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/.test(part)
    )
  },
  alpha: /^[a-zA-Z]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  phone: (input) => {
    if (!/^\+[0-9][0-9 ]{5,27}[0-9]$/.test(input)) return false
    if (/ {2}/.test(input)) return false
    const digits = input.substring(1).replace(/ /g, '').length
    return digits >= 7 && digits <= 15
  },
  'utc-millisec': /^[0-9]{1,15}\.?[0-9]{0,15}$/,
}

/**
 * Compatibility formats
 */

module.exports['host-name'] = module.exports['hostname'] // draft3 backwards compat
