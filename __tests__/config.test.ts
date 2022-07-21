import {expect, test, beforeEach} from '@jest/globals'
import {readConfig} from '../src/config'
import {getRefs} from '../src/git-refs'

// GitHub Action inputs come in the form of environment variables
// with an INPUT prefix (e.g. INPUT_FAIL-ON-SEVERITY)
function setInput(input: string, value: string) {
  process.env[`INPUT_${input.toUpperCase()}`] = value
}

// We want a clean ENV before each test. We use `delete`
// since we want `undefined` values and not empty strings.
function clearInputs() {
  delete process.env['INPUT_FAIL-ON-SEVERITY']
  delete process.env['INPUT_ALLOW-LICENSES']
  delete process.env['INPUT_DENY-LICENSES']
  delete process.env['INPUT_BASE-REF']
  delete process.env['INPUT_HEAD-REF']
}

beforeEach(() => {
  clearInputs()
})

test('it defaults to low severity', async () => {
  const options = readConfig()
  expect(options.fail_on_severity).toEqual('low')
})

test('it reads custom configs', async () => {
  setInput('fail-on-severity', 'critical')
  setInput('allow-licenses', ' BSD, GPL 2')

  const options = readConfig()
  expect(options.fail_on_severity).toEqual('critical')
  expect(options.allow_licenses).toEqual(['BSD', 'GPL 2'])
})

test('it defaults to empty allow/deny lists ', async () => {
  const options = readConfig()

  expect(options.allow_licenses).toEqual(undefined)
  expect(options.deny_licenses).toEqual(undefined)
})

test('it raises an error if both an allow and denylist are specified', async () => {
  setInput('allow-licenses', 'MIT')
  setInput('deny-licenses', 'BSD')

  expect(() => readConfig()).toThrow()
})

test('it raises an error when given an unknown severity', async () => {
  setInput('fail-on-severity', 'zombies')
  expect(() => readConfig()).toThrow()
})

test('it uses the given refs when the event is not a pull request', async () => {
  setInput('base-ref', 'a-custom-base-ref')
  setInput('head-ref', 'a-custom-head-ref')

  const refs = getRefs(readConfig(), {
    payload: {},
    eventName: 'workflow_dispatch'
  })
  expect(refs.base).toEqual('a-custom-base-ref')
  expect(refs.head).toEqual('a-custom-head-ref')
})

test('it raises an error when no refs are provided and the event is not a pull request', async () => {
  const options = readConfig()
  expect(() =>
    getRefs(options, {
      payload: {},
      eventName: 'workflow_dispatch'
    })
  ).toThrow()
})
