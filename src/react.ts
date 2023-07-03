import { Emitter, MultipleTypesHandler } from './evtmitter'

import { useEffect, useLayoutEffect, useRef } from 'react'

type Options = {
  disabled?: boolean
}

export function useOnEvtmitterEvent<
  E extends Record<string, unknown>,
  T extends keyof E,
>(
  evtmitter: Emitter<E>,
  eventsType: T,
  handler: (payload: E[T], type: T) => void,
  options?: Options,
): void
export function useOnEvtmitterEvent<E extends Record<string, unknown>>(
  evtmitter: Emitter<E>,
  eventsType: '*',
  handler: MultipleTypesHandler<E>,
  options?: Options,
): void
export function useOnEvtmitterEvent<
  E extends Record<string, unknown>,
  T extends keyof E,
>(
  evtmitter: Emitter<E>,
  eventsType: T[],
  handler: MultipleTypesHandler<Pick<E, T>>,
  options?: Options,
): void
export function useOnEvtmitterEvent(
  evtmitter: Emitter<any>,
  eventsType: string | string[],
  handler: (payload: any, type: string) => void,
  { disabled = false }: Options = {},
): void {
  const stableHandler = useRef(handler)

  useLayoutEffect(() => {
    stableHandler.current = handler
  })

  useEffect(() => {
    if (disabled) return

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return evtmitter.on(eventsType as any, stableHandler.current)
  }, [evtmitter, eventsType, disabled])
}
