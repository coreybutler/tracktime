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

    t.ok(custom.seconds > 0 && custom.seconds < 2, 'Correctly calculated the number of seconds elapsed (custom timer).')
    t.ok(custom.milliseconds > 0 && custom.milliseconds < 1000, 'Correctly calculated the number of milliseconds elapsed (custom timer).')

    stopwatch.measure('test_label')

    setTimeout(() => {
      let history = stopwatch.history()
      let item = stopwatch.historyLabel('test_label')
      let d = stopwatch.stop() // default

      t.ok(d.seconds > 0 && custom.seconds < 2, 'Correctly calculated the number of seconds elapsed (default timer).')
      t.ok(d.milliseconds > 600 && custom.milliseconds < 1000, 'Correctly calculated the number of milliseconds elapsed (default timer).')
      t.ok(d.total !== custom.total, 'Custom timers are maintained separately from default timer.')
      t.ok(history.length === 2, 'Correct number of historical items.')
      t.ok(item !== null, 'Retrieving a specific item from the history yields a duration object (default timer).')
      t.end()
    }, 600)
  }, 1000)
})