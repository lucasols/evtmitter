import { Emitter, MultipleTypesHandler } from './evtmitter'

import { useEffect, useLayoutEffect, useRef } from 'react'

type Options = {
  disabled?: boolean
}

export function useOnEvtmitterEvent<
  E extends Record<string, unknown>,
  T extends keyof E,
>(
  evtmitter: Emitter<E> | undefined | false,
  eventsType: T,
  handler: (payload: E[T], type: T) => void,
  options?: Options,
): void
export function useOnEvtmitterEvent<E extends Record<string, unknown>>(
  evtmitter: Emitter<E> | undefined | false,
  eventsType: '*',
  handler: MultipleTypesHandler<E>,
  options?: Options,
): void
export function useOnEvtmitterEvent<
  E extends Record<string, unknown>,
  T extends keyof E,
>(
  evtmitter: Emitter<E> | undefined | false,
  eventsType: T[],
  handler: MultipleTypesHandler<Pick<E, T>>,
  options?: Options,
): void
export function useOnEvtmitterEvent(
  evtmitter: Emitter<any> | undefined | false,
  eventsType: string | string[],
  handler: (payload: any, type: string) => void,
  { disabled = false }: Options = {},
): void {
  const stableHandler = useRef(handler)

  useLayoutEffect(() => {
    stableHandler.current = handler
  })

  useEffect(() => {
    if (disabled || !evtmitter) return

    return evtmitter.on(eventsType as any, (payload, type) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      stableHandler.current(payload, type)
    })
  }, [evtmitter, eventsType, disabled])
}
