/**
 * @class Stopwatch
 * The stopwatch is a collection of timers that track the time elapsed
 * between measurements (like ticks on a stopwatch).
 */
export default class Stopwatch {
  #name = null
  /* node-only */
  #hrtime = process.hrtime
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
    this.start()
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
   * Stop the timer and return the total duration.
   * This is effectively the same as calling the #duration method,
   * then removing the timer.
   */
  stop (name = null) {
    const result = this.duration(name)

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
   * @propery {numeric} milliseconds
   * @propery {numeric} total
   * The total number of milliseconds elapsed.
   * @propery {date} timestamp
   * The timestamp when the duration was calculated.
   * @propery {string} display
   * A string representation of the elapsed time. (convenience attribute)
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

    let ms = (timer.hrtime[1] / 1e9) * 100000

    timer.history.push([timer.hrtime[0], ms, label])
    
    this.#timers.set(name || this.#default, timer)

    return {
      label,
      seconds: timer.hrtime[0],
      milliseconds: ms,
      total: (timer.hrtime[0] * 1000) + ms,
      display: ((timer.hrtime[0] !== 0 ? `${timer.hrtime[0]}s ` : ' ') + (ms !== 0 ? `${ms}ms` : '')).trim(),
      timestamp: ts.getTime()
    }
  }

  /**
   * Returns the total amount of time elapsed since the start.
   * @param {string} [name]
   * The name of the timer. Uses the default timer if this is not specified.
   * @param {boolean} [includeCurrentTime=true]
   * Include all time up to the moment this method is called. If set to false,
   * this will calculate the duration up to the last measurement only.
   * @return {Duration}
   * Returns a duration, or `null` if the timer is unknown/unrecognized.
   */
  duration (name = null, includeCurrentTime = true) {
    let timer = this.#timers.get(name || this.#default)

    if (timer === null) {
      return null
    }

    let sec = 0
    let ms = 0

    if (includeCurrentTime) {
      this.measure(null, name)
    }

    timer.history.forEach(el => {
      sec += el[0]
      ms += el[1]
    })

    let ts = new Date()

    return {
      label: `${name === null ? '' : name} total`.trim(),
      seconds: sec,
      milliseconds: ms,
      total: (sec * 1000) + ms,
      display: ((sec !== 0 ? `${sec}s ` : ' ') + (ms !== 0 ? `${ms}ms` : '')).trim(),
      timestamp: ts.getTime()
    }
  }

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

    let result = timer.history.filter(item => item[item.length - 1].trim().toLowerCase() === label.trim().toLowerCase())

    if (result.length === 0) {
      return null
    }

    result = result[0]

    return {
      seconds: result[0],
      milliseconds: result[1],
      label: result[3],
      total: (result[0] * 1000) + result[1],
      display: ((result[0] !== 0 ? `${result[0]}s ` : ' ') + (result[1] !== 0 ? `${result[1]}ms` : '')).trim(),
      timestamp: null
    }
  }
}
