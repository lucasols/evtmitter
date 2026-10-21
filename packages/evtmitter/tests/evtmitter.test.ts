import { describe, expect, test, vi } from 'vitest'
import { evtmitter } from '../src/index'

describe('on()', () => {
  test('should register handler for new type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn((payload_: string) => {})

    emitter.on('foo', ({ payload }) => spy(payload))

    emitter.emit('foo', 'bar')

    expect(spy).toBeCalledWith('bar')
  })

  test('should append handler for existing type', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn((payload_: string) => {})
    const spy2 = vi.fn((payload_: string) => {})

    emitter.on('foo', ({ payload }) => spy(payload))
    emitter.on('foo', ({ payload }) => spy2(payload))

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

    const spy = vi.fn((payload_: string | number, type_: string) => {})

    const remove = emitter.on('*', ({ type, payload }) => spy(payload, type))

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

    const spy = vi.fn((payload_: undefined) => {})

    emitter.on('foo', ({ payload }) => spy(payload))

    emitter.emit('foo')

    expect(spy).toHaveBeenLastCalledWith(undefined)
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

  test('off(*) should remove all handlers of all types', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()
    const spy2 = vi.fn()

    emitter.on('foo', spy)
    emitter.on('bar', spy2)
    emitter.off('*')

    emitter.emit('foo', 'bar')
    emitter.emit('bar', 123)

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

  test('should remove handler even if it throws', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn(() => {
      throw new Error('handler error')
    })

    emitter.once('foo', spy)

    expect(() => emitter.emit('foo', 'bar')).toThrow('handler error')
    emitter.emit('foo', 'bar')

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('emit() with throwing handlers', () => {
  test('should call the remaining handlers and rethrow the error', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()
    const wildcardSpy = vi.fn()
    const error = new Error('handler error')

    emitter.on('foo', () => {
      throw error
    })
    emitter.on('foo', ({ payload }) => {
      spy(payload)
    })
    emitter.on('*', ({ payload }) => {
      wildcardSpy(payload)
    })

    expect(() => emitter.emit('foo', 'bar')).toThrow(error)

    expect(spy).toHaveBeenCalledWith('bar')
    expect(wildcardSpy).toHaveBeenCalledWith('bar')
  })

  test('should throw an AggregateError if multiple handlers throw', () => {
    const emitter = evtmitter<{ foo: string }>()

    const spy = vi.fn()
    const error1 = new Error('handler error 1')
    const error2 = new Error('handler error 2')

    emitter.on('foo', () => {
      throw error1
    })
    emitter.on('foo', ({ payload }) => {
      spy(payload)
    })
    emitter.on('*', () => {
      throw error2
    })

    let thrown: unknown

    try {
      emitter.emit('foo', 'bar')
    } catch (e) {
      thrown = e
    }

    expect(spy).toHaveBeenCalledWith('bar')
    expect(thrown).toBeInstanceOf(AggregateError)
    expect(thrown).toMatchObject({
      message: '2 handlers threw while emitting "foo"',
      errors: [error1, error2],
    })
  })
})

describe('on/off/once() with multiple types', () => {
  test('should accept multiple types', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    const spy = vi.fn()

    emitter.on(['foo', 'bar'], ({ payload, type }) => {
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

    emitter.once(['foo', 'bar'], ({ type, payload }) => {
      spy(payload, type)
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

  test('should allow on with multiple types with void function', () => {
    const emitter = evtmitter<{ foo: string; bar: number }>()

    let wasCalled = false
    emitter.on(['foo', 'bar'], () => {
      wasCalled = true
    })

    emitter.emit('foo', 'bar')

    expect(wasCalled).toBe(true)

    let payload: string | number | undefined

    emitter.on(['foo', 'bar'], ({ payload: p }) => {
      payload = p
    })

    emitter.emit('foo', 'bar')

    expect(payload).toBe('bar')

    let payloadAndType:
      | { type: 'foo'; payload: string }
      | { type: 'bar'; payload: number }
      | undefined

    emitter.on(['foo', 'bar'], (event) => {
      payloadAndType = event
    })

    emitter.emit('foo', 'bar')

    expect(payloadAndType).toEqual({ type: 'foo', payload: 'bar' })
  })
})
