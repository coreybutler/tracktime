import 'source-map-support/register.js'
import test from 'tape'
import TrackTime from '../../.node/index.js'

test('Sanity Checks', t => {
  t.ok(TrackTime !== undefined, 'Library is instantiated.')

  let stopwatch = new TrackTime('Demo Stopwatch')

  t.ok(stopwatch.name === 'Demo Stopwatch', 'Correctly set name of stopwatch.')

  stopwatch.start('test_watch')

  setTimeout(() => {
    const custom = stopwatch.stop('test_watch')

    t.ok(custom.seconds > 0 && custom.seconds < 2, `Correctly calculated the number of seconds elapsed (custom timer). Expected between 0-2, received "${custom.seconds}"`)
    t.ok(custom.milliseconds > 0 && custom.milliseconds < 1000, `Correctly calculated the number of milliseconds elapsed (custom timer). Expected < 1000, received "${custom.milliseconds}"`)

    stopwatch.measure('test_label')

    setTimeout(() => {
      const history = stopwatch.history()
      const item = stopwatch.historyLabel('test_label')
      const d = stopwatch.stop() // default

      t.ok(d.seconds > 0 && d.seconds < 2, `Correctly calculated the number of seconds elapsed (default timer). Expected <2, received "${d.seconds}"`)
      t.ok(d.milliseconds > 600 && d.milliseconds < 1000, `Correctly calculated the number of milliseconds elapsed (default timer). Expected 600-1000, received "${d.milliseconds}"`)
      t.ok(d.total !== custom.total, `Custom timers are maintained separately from default timer. Expected "${d.total}" !== "${custom.total}"`)
      t.ok(history.length === 2, `Correct number of historical items. Expected 2, received "${history.length}"`)
      t.ok(item !== null, `Retrieving a specific item from the history yields a duration object (default timer). Expected non-null, received "${item}"`)
      t.end()
    }, 600)
  }, 1050)
})

test('Longer execution times', t => {
  let watch = new TrackTime()

  watch.start('test')

  let count = 0
  let interval = setInterval(() => {
    count++
    let out = watch.measure(`Mark ${count}`, 'test')

    t.ok(out.seconds === 2, `Proper number of seconds elapsed. Expected 2, received "${out.seconds}"`)
    t.ok(out.milliseconds < 500, `Proper number of milliseconds recorded. Expected less than 500, received "${out.milliseconds}"`)
    t.ok(watch.history('test').length === count, `Correct number of historical items recorded. Expected ${count}, received "${watch.history('test').length}"`)

    if (count === 5) {
      clearInterval(interval)
      t.end()
    }
  }, 2050)
})