import { Emitter, Handler } from 'evtmitter'

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
  handler: Handler<Pick<E, T>>,
  options?: Options,
): void
export function useOnEvtmitterEvent<E extends Record<string, unknown>>(
  evtmitter: Emitter<E> | undefined | false,
  eventsType: '*',
  handler: Handler<E>,
  options?: Options,
): void
export function useOnEvtmitterEvent<
  E extends Record<string, unknown>,
  T extends keyof E,
>(
  evtmitter: Emitter<E> | undefined | false,
  eventsType: T[],
  handler: Handler<Pick<E, T>>,
  options?: Options,
): void
export function useOnEvtmitterEvent(
  evtmitter: Emitter<any> | undefined | false,
  eventsType: string | string[],
  handler: Handler<Record<string, unknown>>,
  { disabled = false }: Options = {},
): void {
  const stableHandler = useRef(handler)

  useLayoutEffect(() => {
    stableHandler.current = handler
  })

  useEffect(() => {
    if (disabled || !evtmitter) return

    return evtmitter.on(eventsType as any, (event) =>
      stableHandler.current(event),
    )
  }, [evtmitter, eventsType, disabled])
}
