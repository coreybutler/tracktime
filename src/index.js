const NS_PER_SECOND = 1e9
const NS_PER_MILLISECOND = 1e6
/* node-only */
const USE_BIGINT = process.hrtime.bigint !== undefined
/* end-node-only */

/**
 * @class Stopwatch
 * The stopwatch is a collection of timers that track the time elapsed
 * between measurements (like ticks on a stopwatch).
 */
export default class Stopwatch {
  #name = null
  /* node-only */
  #hrtime = start => {
    if (USE_BIGINT) {
      let end = process.hrtime.bigint()

      if (start) {
        end -= start
      }

      return end
    }

    return process.hrtime(start)
  }
  /* end-node-only */
  /* browser-only */
  // This polyfill adapted from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js (Used under BSD-2 Simplified license)
  #performance = globalThis.performance || {}
  #performanceNow =
    this.#performance.now ||
    this.#performance.mozNow ||
    this.#performance.msNow ||
    this.#performance.oNow ||
    this.#performance.webkitNow ||
    function () { return (new Date()).getTime() }

  // Generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  #hrtime = previousTimestamp => {
    let clocktime = this.#performanceNow.call(this.#performance) * 1e-3
    let seconds = Math.floor(clocktime)
    let nanoseconds = Math.floor((clocktime % 1) * 1e9)

    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0]
      nanoseconds = nanoseconds - previousTimestamp[1]
      if (nanoseconds < 0) {
        seconds--
        nanoseconds += 1e9
      }
    }

    return [seconds, nanoseconds]
  }
  /* end-browser-only */
  #default = Symbol('default')
  #timers = new Map()

  constructor (name = null) {
    this.#name = name || 'Unknown TrackTime'
    this.#timers.set(this.#default, {
      hrtime: this.#hrtime(),
      history: []
    })
  }

  get name () {
    return this.#name
  }

  /**
   * @property {[]string}
   * An array of timers managed by this stopwatch. (Does **not** include the system defaul timer)
   */
  get timers () {
    return Array.from(this.#timers.keys()).filter(item => item !== this.#default)
  }

  /**
   * Parse a big integer into seconds, milliseconds and nanoseconds.
   * This is useful for parsing elapsed/total time values.
   * @param {number} integer
   * @return {object}
   * Returns an object like:
   * ```javascript
   * {
   *   seconds: 1,
   *   milliseconds: 749,
   *   nanoseconds: 23419
   * }
   * ```
   */
  parse (int) {
    const seconds = Math.floor(int / NS_PER_SECOND)
    const milliseconds = Math.floor((int - (seconds * NS_PER_SECOND)) / NS_PER_MILLISECOND)
    const nanoseconds = int - (seconds * NS_PER_SECOND) - (milliseconds * NS_PER_MILLISECOND)

    return { seconds, milliseconds, nanoseconds }
  }

  /**
   * Start or retstart a timer.
   * @param {string} [name]
   * The name of the timer. Uses the default timer if this is not specified.
   */
  start (name = null) {
    this.#timers.set(name || this.#default, {
      hrtime: this.#hrtime(),
      history: []
    })
  }

  /**
   * Stop the timer and return the total duration, then remove the timer.
   */
  stop (name = null) {
    const result = this.measure('stop', name)
    const total = this.parse(result.total)
    
    result.seconds = total.seconds
    result.milliseconds = total.milliseconds
    result.nanoseconds = total.nanoseconds
    result.elapsed = result.total

    this.remove(name)

    return result
  }

  /**
   * Removes the specified timer. If no timer name is specified,
   * it defaults to the default timer, which cannot be removed. In this
   * case, the default timer is simply reset.
   */
  remove (name = null) {
    if (name === null) {
      this.start(this.#default) // restart default
    } else if (this.#timers.has(name)) {
      this.#timers.delete(name)
    }
  }

  /**
   * @type {Object} Duration
   * Represents the duration elapsed between time measurements.
   * @propery {string} [label]
   * An optional label, typically used to identify measurements for a specific process.
   * @propery {numeric} seconds
   * Number of seconds since the last measurement.
   * @propery {numeric} milliseconds
   * Number of milliseconds since the last measurement.
   * @propery {numeric} nanoseconds
   * Number of nanoseconds since the last measurement.
   * @propery {numeric} elapsed
   * The total number of nanoseconds elapsed since last measurement.
   * @propery {numeric} total
   * The total number of nanoseconds elapsed since the timer started.
   * @propery {date} timestamp
   * The timestamp when the duration was calculated.
   * @propery {string} display
   * A string representation of the time elapsed since the last measurement. (convenience attribute)
   * @property {string} display_total
   * A convenience attribute representing the total time elapsed since the timer started.
   * @property {string} display_ms
   * A convenience attribute representing the milliseconds elapsed since the last measurement.
   * @property {string} display_ns
   * A convenience attribute representing the nanoseconds elapsed since the last measurement.
   * @property {string} display_seconds
   * A convenience attribute representing the seconds elapsed since the last measurement.
   */

  /**
   * Return the time elapsed since the last measurement.
   * @param {string} [label]
   * An optional label for the measurement.
   * @param {string} [name]
   * The name of the timer. Uses the default timer if this is not specified.
   * @return {Duration}
   * Returns a duration, or `null` if the named timer is uncrecognized.
   */
  measure (label = null, name = null) {
    let timer = this.#timers.get(name || this.#default)

    if (!timer) {
      return null
    }

    let ts = new Date()
    label = label || (name === null ? 'System Default' : name) + ` measurement ${timer.history.length + 1}`

    timer.hrtime = this.#hrtime(this.#timers.get(name || this.#default).hrtime)
    
    const hrtime = Array.isArray(timer.hrtime) ? timer.hrtime : [Math.floor(Number(timer.hrtime) / NS_PER_SECOND), Math.round((Number(timer.hrtime) % NS_PER_SECOND))]
    const seconds = hrtime[0]
    const elapsed = (seconds * NS_PER_SECOND) + hrtime[1]
    const ms = Math.floor(hrtime[1] / NS_PER_MILLISECOND)
    const ns = hrtime[1] % NS_PER_MILLISECOND
    const total = timer.history.length === 0 ? elapsed : timer.history[timer.history.length - 1].total + elapsed

    // Reset the timer, to prevent https://github.com/nodejs/node-v0.x-archive/issues/3984
    timer.hrtime = this.#hrtime()

    timer.history.push({
      timer: name || 'system_default',
      label,
      elapsed,
      total,
      seconds,
      milliseconds: ms,
      nanoseconds: ns,
      timestamp: ts
    })
    
    this.#timers.set(name || this.#default, timer)

    return {
      timer: name || 'system_default',
      label,
      seconds,
      milliseconds: ms,
      nanoseconds: ns,
      elapsed,
      total,
      display: ((hrtime[0] !== 0 ? `${hrtime[0]}s ` : ' ') + (ms !== 0 ? `${ms}ms ` : ' ') + (ns !== 0 ? `${ns}ns` : '')).trim(),
      timestamp: ts,
      get display_total () {
        const t = this.parse(total)
        return ((t.seconds !== 0 ? `${t.seconds}s ` : ' ') + (t.milliseconds !== 0 ? `${t.milliseconds}ms ` : ' ') + (t.nanoseconds !== 0 ? `${t.nanoseconds}ns` : '')).trim()
      },
      get display_ms() {
        return (elapsed / NS_PER_MILLISECOND) + 'ms'
      },
      get display_ns() {
        return elapsed + 'ns'
      },
      get display_seconds() {
        return elapsed / NS_PER_SECOND + 's'
      }
    }
  }

  // /**
  //  * Returns the total amount of time elapsed since the start.
  //  * @param {string} [name]
  //  * The name of the timer. Uses the default timer if this is not specified.
  //  * @param {boolean} [includeCurrentTime=true]
  //  * Include all time up to the moment this method is called. If set to false,
  //  * this will calculate the duration up to the last measurement only.
  //  * @return {Duration}
  //  * Returns a duration, or `null` if the timer is unknown/unrecognized.
  //  */
  // duration (name = null, includeCurrentTime = true) {
  //   let timer = this.#timers.get(name || this.#default)

  //   if (timer === null) {
  //     return null
  //   }

  //   let sec = 0
  //   let ms = 0

  //   if (includeCurrentTime) {
  //     this.measure(null, name)
  //   }

  //   timer.history.forEach(el => {
  //     sec += el[0]
  //     ms += el[1]
  //   })

  //   let ts = new Date()

  //   return {
  //     label: `${name === null ? '' : name} total`.trim(),
  //     seconds: sec,
  //     milliseconds: ms,
  //     total: (sec * 1000) + ms,
  //     display: ((sec !== 0 ? `${sec}s ` : ' ') + (ms !== 0 ? `${ms}ms` : '')).trim(),
  //     timestamp: ts.getTime()
  //   }
  // }

  // Retrieves the history of a timer.
  history (name = null) {
    let timer = this.#timers.get(name || this.#default)
    return timer === null ? [] : timer.history
  }

  /**
   * Retrieve a specific record from the history.
   * **Notice the order of arguments passed to this method.**
   * @param {string} [label]
   * The label for the measurement. (case-_insensitive_)
   * @param {string} [name]
   * The name of the timer. Uses the default timer if this is not specified.
   * @return {Duration}
   * Returns a duration, or `null` if the named timer or label is uncrecognized.
   */
  historyLabel (label = null, name = null) {
    if (label === null) {
      return null
    }

    let timer = this.#timers.get(name || this.#default)

    if (!timer) {
      return null
    }

    let result = timer.history.filter(item => item.label.trim().toLowerCase() === label.trim().toLowerCase())

    if (result.length === 0) {
      return null
    }

    return result[0]
  }
}
