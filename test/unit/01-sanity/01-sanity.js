import 'source-map-support/register.js'
import test from 'tape'
import Stopwatch from '../../.node/index.js'

test('Sanity Checks', t => {
  t.ok(Stopwatch !== undefined, 'Library is instantiated.')

  let timer = new Stopwatch('Demo Stopwatch')

  t.ok(timer.name === 'Demo Stopwatch', 'Correctly set name of stopwatch.')

  timer.start('test_watch')

  setTimeout(() => {
    let custom = timer.stop('test_watch')

    t.ok(custom.seconds > 0 && custom.seconds < 2, 'Correctly calculated the number of seconds elapsed.')
    t.ok(custom.milliseconds > 0 && custom.milliseconds < 1000, 'Correctly calculated the number of milliseconds elapsed.')

    timer.measure()

    setTimeout(() => {
      let history = timer.history()
      let d = timer.stop() // default

      t.ok(d.seconds > 0 && custom.seconds < 2, 'Correctly calculated the number of seconds elapsed.')
      t.ok(d.milliseconds > 600 && custom.milliseconds < 1000, 'Correctly calculated the number of milliseconds elapsed.')
      t.ok(d.total !== custom.total, 'Custom timers are maintained separately from defualt timer.')
      t.ok(history.length === 2, 'Correct number of historical items.')

      t.end()
    }, 600)
  }, 1000)
})