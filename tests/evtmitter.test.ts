import { describe, expect, test, vi } from 'vitest'
import { evtmitter } from '../src/evtmitter'

describe('on()', () => {
  test('should register handler for new type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()

    emitter.on('foo', (payload) => spy(payload))

    emitter.emit('foo', 'bar')

    expect(spy).toBeCalledWith('bar')
  })

  test('should append handler for existing type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()
    const spy2 = vi.fn()

    emitter.on('foo', (payload) => spy(payload))
    emitter.on('foo', (payload) => spy2(payload))

    emitter.emit('foo', 'bar')

    expect(spy).toHaveBeenLastCalledWith('bar')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenLastCalledWith('bar')
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  test('should not add duplicate listeners', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()

    emitter.on('foo', spy)
    emitter.on('foo', spy)

    emitter.emit('foo', 'bar')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should invoke * handlers', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    const remove = emitter.on('*', (type, payload) => spy(type, payload))

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenLastCalledWith('bar', 'foo')
    emitter.emit('bar', 123)
    expect(spy).toHaveBeenLastCalledWith(123, 'bar')

    remove()

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  test('should return a function to remove handler', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()

    const off = emitter.on('foo', spy)

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenCalledTimes(1)

    off()

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('emit without payload', () => {
    const emitter = evtmitter<{ foo: undefined }>()

    const spy = vi.fn()

    emitter.on('foo', spy)

    emitter.emit('foo')

    expect(spy).toBeCalledWith(undefined)
  })
})

describe('off()', () => {
  test('should remove handler for type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()

    emitter.on('foo', spy)
    emitter.off('foo', spy)

    emitter.emit('foo', 'bar')

    expect(spy).not.toBeCalled()
  })

  test('off("type") should remove all handlers of the given type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()
    const spy2 = vi.fn()

    emitter.on('foo', spy)
    emitter.on('foo', spy2)
    emitter.off('foo')

    emitter.emit('foo', 'bar')

    expect(spy).not.toBeCalled()
    expect(spy2).not.toBeCalled()
  })
})

describe('once()', () => {
  test('should call handler only once', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()

    emitter.once('foo', spy)

    emitter.emit('foo', 'bar')
    emitter.emit('foo', 'bar')

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('on/off/once() with multiple types', () => {
  test('should accept multiple types', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    emitter.on(['foo', 'bar'], (payload, type) => {
      spy(payload, type)
    })

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenLastCalledWith('bar', 'foo')

    emitter.emit('bar', 123)
    expect(spy).toHaveBeenLastCalledWith(123, 'bar')
  })

  test('once() should accept multiple types', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    emitter.once(['foo', 'bar'], (type, payload) => {
      spy(type, payload)
    })

    emitter.emit('foo', 'bar')
    expect(spy).toHaveBeenLastCalledWith('bar', 'foo')
    expect(spy).toHaveBeenCalledTimes(1)

    emitter.emit('foo', 'bar')
    emitter.emit('bar', 123)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should remove handler for all types', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    emitter.on(['foo', 'bar'], spy)
    emitter.off(['foo', 'bar'], spy)

    emitter.emit('foo', 'bar')
    emitter.emit('bar', 123)

    expect(spy).not.toBeCalled()
  })

  test('should return a function to remove handler', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    const off = emitter.on(['foo', 'bar'], spy)

    emitter.emit('foo', 'bar')
    emitter.emit('bar', 123)
    expect(spy).toHaveBeenCalledTimes(2)

    off()

    emitter.emit('foo', 'bar')
    emitter.emit('bar', 123)
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
