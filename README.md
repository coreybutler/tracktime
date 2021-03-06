# tracktime ![Version](https://img.shields.io/github/v/tag/coreybutler/tracktime?label=Latest%20Version&style=for-the-badge)

This cross-runtime JavaScript library measures/tracks time for one or more processes.

Think of it like a stopwatch that is always running. At certain points, you observe the time/take a measurement. These measurements are used to calculate how much time has elapased. It's like viewing slices of a timeline.

Using this library, developers can precisely track time for any number of processes. The unique `history` method provides a way to see elapsed times and a complete timeline history.

The library uses [hrtime](https://nodejs.org/api/process.html) for Node.js and the [Performance API (Now)](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) in the browser. If the performance API is unavailable, it falls back to a less precise but still accurate polyfill based on [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).


### Example

This example is uses the ES Module imports, presented as it would be used in Node.js (12.x.x with `--experimental-modules` flag or Node 14.x.x and beyond). For use in other runtimes, see the [installation](#installation) section.

```javascript
import TrackTime from 'node-tracktime'

stopwatch = new TrackTime('My System')
stopwatch.start('subprocess')

// ... do something...
let metric = stopwatch.measure('subprocess', 'Task 1')
console.log(metric)

// ... do something else...
let result = stopwatch.measure('subprocess', 'Task 2')
console.log(result)

const history = stopwatch.history('subprocess')

console.log('Total Time:', stopwatch.stop('subprocess', false))

console.log(history)
```

The code above would output the following:

```sh
{
  "timer": "subprocess"
  "label": "Task 1",
  "seconds": 1,
  "milliseconds": 568,
  "nanoseconds": 5149,
  "elapsed": 15685149000000001,
  "total": 15685149000000001,
  "display": "1s 568ms 5149ns",
  "timestamp": "2020-04-12T03:54:35.929Z"
}

{
  "timer": "subprocess"
  "label": "Task 2",
  "seconds": 0,
  "milliseconds": 793,
  "nanoseconds": 4923,
  "elapsed": 7934923000000001,
  "total": 7934923000000001,
  "display": "793.4923ms",
  "timestamp": "2020-04-12T03:54:65.729Z"
}

{
  "timer": "subprocess"
  "label": "stop",
  "seconds": 2,
  "milliseconds": 362,
  "nanoseconds": 72,
  "elapsed": 23620072000000002,
  "total": 23620072000000002,
  "display": "2s 362ms 72ns",
  "timestamp": "2020-04-12T03:56:95.829Z"
}

[
  {
    "timer": "subprocess"
    "label": "Task 1",
    "seconds": 1,
    "milliseconds": 568,
    "nanoseconds": 5149,
    "elapsed": 15685149000000001,
    "total": 15685149000000001,
    "timestamp": "2020-04-12T03:54:35.929Z"
  }, {
    "timer": "subprocess"
    "label": "Task 2",
    "seconds": 0,
    "milliseconds": 793,
    "nanoseconds": 4923,
    "elapsed": 7934923000000001,
    "total": 7934923000000001,
    "timestamp": "2020-04-12T03:54:65.729Z"
  }
]
```

A [breakdown](#duration-object) of this output can be found in the API documentation below.

## Sponsors

<table cellpadding="10" cellspacing="0" border="0">
  <tr>
    <td><a href="https://metadoc.io"><img src="https://github.com/coreybutler/staticassets/raw/master/sponsors/metadoclogobig.png" width="200px"/></a></td>
    <td><a href="https://butlerlogic.com"><img src="https://github.com/coreybutler/staticassets/raw/master/sponsors/butlerlogic_logo.png" width="200px"/></a></td>
  </tr>
</table>

## Installation

This module is available in the following variations:

### For Modern Node (ES Modules)

`npm install node-tracktime`

Please note, you'll need a verison of Node that support ESM Modules. In Node 12, this feature is behind the `--experimental-modules` flag. It is available in Node 13+ without a flag, but your `package.json` file must have the `"type": "module"` attribute.

### For Legacy Node (CommonJS/require)

If you need to use the older CommonJS format (i.e. `require`), run `npm install node-tracktime-legacy` instead.

### For Browsers

**CDN**

```javascript
import TrackTime from 'https://cdn.pika.dev/browser-tracktime'
```

Also available from [jsdelivr](https://www.jsdelivr.com/?query=tracktime) and [unpkg](https://unpkg.com/browser-tracktime).

**npm options**

If you wish to bundle this library in your build process, use the version most appropriate for your target runtimes:

- `npm install tracktime` (source)
- `npm install browser-tracktime` (Minified ES Module)
- `npm install browser-tracktime-es6` (IIFE Minified Module - globally accessible)

### Debugging

Each distribution has a corresponding `-debug` version that should be installed _alongside_ the main module (the debugging is an add-on module). For example, `npm install node-tracktime-debug --save-dev` would install the debugging code for Node.

## API

The `TrackTime` object is a class. A new instance of the class can be instantiated like this:

```javascript
const stopwatch = new TrackTime('optional name')
```

### Attributes

The following attributes are available on each instance of the stopwatch:

#### name
The name of the stopwatch (optional). Defaults to `Unknown TrackTime`.

#### timers
An array of the named timers associated with the instance.

### Methods

The following methods are available on each instance of the stopwatch:

Most methods accept an optional `[name]` attribute. A name can be assigned to a timer, essentially creating a unique named timer. Timers do not interact with each other. If a name is not specified, the default internal timer is used.

#### start([name])

Start or restart a timer. The name is optional. If the name is not specified, the default timer is used.

#### stop([name])

Stop and remove the timer. The final duration is returned.

#### remove([name])

Remove a timer. Nothing is returned.

The default/internal timer cannot be removed. If this method supplies no `name` parameter, the default internal timer is restarted (as if `start()` were run).

#### measure([name], [label])

This measures the time elapsed since the last measurement, or from the start if there is no prior measurement. The response contains a duration object (documented below).

The label is optional. It is included in the response and in the timer history, making it easy to annotate an execution/performance report.

<!-- #### duration([name], [includeCurrentTime=true])

Returns the total amount of time elapsed since the start.

The `includeCurrentTime` attribute adds all elapsed time up to the moment this method is called. If set to false, this will calculate the duration up to the last measurement only. -->

#### history([name])

Retrieves the history of a timer. This is an array of arrays, following this format:

```javascript
[
  {
    "timer": string
    "label": string
    "elapsed": number
    "total": number
    "seconds": number
    "milliseconds": number
    "nanoseconds": number
    "timestamp": datetime
  }
]
```

#### historyLabel(label, [name])

Retrieves a specific timer's history item (by label). Returns an object or null if the item cannot be found.

#### parse(int)

A method to parse a big integer into its time elements. Results look like:

```javascript
{
  seconds: 1,
  milliseconds: 749,
  nanoseconds: 23419
}
```

Parsing is usually handled automatically, but this is useful if you need to process an elapsed or total time within a timer history, compare to another timer, etc.

### Duration Object

This is the object which is returned by a few different methods.

_Example_:

```javascript
{
  "timer": 'system_default',
  "label": 'stop',
  "seconds": 1,
  "milliseconds": 608,
  "nanoseconds": 465125,
  "elapsed": 1608465125,
  "total": 1608465125,
  "display": "604ms 731762ns",
  "timestamp": "2020-04-12T03:54:35.929Z",
  "display_total": [Getter],
  "display_ms": [Getter],
  "display_ns": [Getter],
  "display_seconds": [Getter]
}
```

- **timer**: The name of the timer. This will be `system_default` unless a custom timer is used.
- **label**: An optional label to assign to the measurement. Useful for identify which task/process is being tracked.
- **seconds**: The total seconds elapsed.
- **milliseconds**: The milliseconds elapsed.
- **nanoseconds**: The milliseconds elapsed.
- **elapsed**: The seconds + milliseconds provides the total elapsed time.
- **total**: The total time (nanoseconds) since the timer started.
- **display**: A convenience attribute providing a displayable version of the elapsed time.
- **timestamp**: The timestamp when the measurement was recorded.
- **display_total**: A convenience attribute representing the total time elapsed since the timer started.
- **display_ms**: A convenience attribute representing the milliseconds elapsed since the last measurement.
- **display_ns**: A convenience attribute representing the nanoseconds elapsed since the last measurement.
- **display_seconds**: A convenience attribute representing the seconds elapsed since the last measurement.

## Tracking Processes

This library works well for tracking how much time elapses in each step of a multi-step processes.

I build my workflows with [shortbus](https://github.com/coreybutler/shortbus), which is a task runner for Node.js (Browser version is part of [NGN 2.0.0 Queues](https://github.com/ngnjs/ngn)). Combined with tracktime, it can provide solid insights about workflows. 

_Example using shortbus:_
```javascript
import TrackTime from 'node-tracktime'
import TaskRunner from 'shortbus'

const stopwatch = new TrackTime()
const tasks = new TaskRunner()

tasks.add('task 1', next => ...)
tasks.add('task 2', next => ...)
tasks.add('task 3', next => ...)

tasks.on('stepstarted', step => stopwatch.measure('start', step.name))
tasks.on('stepcomplete', step => stopwatch.measure('total duration', step.name))
tasks.on('complete', () => {
  stopwatch.timers.forEach(timer => {
    console.log(stopwatch.history(timer))
  })
})

tasks.run(true)
```

## License

MIT

## Credits

Created by [Corey Butler](https://github.com/coreybutler)