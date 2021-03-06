const SHORTSPLIT = /$|[!-@\[-`{-~].*/g

module.exports = function(args, opts) {
  opts = opts || {}
  var alias = aliases(opts.alias)
  return parse(
    args,
    alias,
    defaults(opts.default, alias),
    opts.unknown,
    { _: [] }
  )
}

function parse(args, aliases, defaults, unknown, out) {
  for (var i = 0, j = 0, len = args.length, _ = out._; i < len; i++) {
    var arg = args[i]

    if ("--" === arg) {
      while (++i < len) {
        _.push(args[i])
      }
    } else if ("-" === arg[0]) {
      if ("-" === arg[1]) {
        var end = arg.indexOf("=")
        if (0 <= end) {
          set(arg.slice(2, end), arg.slice(end + 1), out, aliases, unknown)
        } else {
          if ("n" === arg[2] && "o" === arg[3] && "-" === arg[4]) {
            set(arg.slice(5), false, out, aliases, unknown)
          } else {
            set(
              arg.slice(2),
              (j = i + 1) === len || "-" === args[j][0] || args[(i = j)],
              out,
              aliases,
              unknown
            )
          }
        }
      } else {
        SHORTSPLIT.lastIndex = 2
        var match = SHORTSPLIT.exec(arg)
        var value = match[0] || (j = i + 1) === len || "-" === args[j][0] || args[(i = j)]
        var end = match.index

        for (j = 1; j < end; ) {
          set(arg[j], ++j !== end || value, out, aliases, unknown)
        }
      }
    } else {
      _.push(arg)
    }
  }

  for (var key in defaults) {
    if (undefined === out[key]) {
      out[key] = defaults[key]
    }
  }

  return out
}

function aliases(aliases) {
  var out = {}

  for (var key in aliases) {
    var alias = (out[key] = toArray(aliases[key]))

    for (var i = 0, len = alias.length; i < len; i++) {
      var curr = (out[alias[i]] = [key])

      for (var j = 0; j < len; j++) {
        if (i !== j) {
          curr.push(alias[j])
        }
      }
    }
  }

  return out
}

function defaults(defaults, aliases) {
  var out = {}

  for (var key in defaults) {
    var value = defaults[key];
    var alias = aliases[key];

    if (undefined === out[key]) {
      out[key] = value;

      if (undefined !== alias) {
        for (var i = 0, len = alias.length; i < len; i++) {
          out[alias[i]] = value
        }
      }
    }
  }

  return out
}

function set(key, value, out, aliases, unknown) {
  var curr = out[key]
  var alias = aliases[key]
  var hasAlias = undefined !== alias

  if (hasAlias || undefined === unknown || unknown(key) !== false) {
    if (undefined === curr) {
      out[key] = value
    } else {
      if (Array.isArray(curr)) {
        curr.push(value)
      } else {
        out[key] = [curr, value]
      }
    }

    if (hasAlias) {
      for (var i = 0, len = alias.length; i < len; ) {
        out[alias[i++]] = out[key]
      }
    }
  }
}

function toArray(any) {
  return Array.isArray(any) ? any : [any]
}
