import { useState, useEffect, useRef, useCallback } from 'react'

interface Options {
  timeoutMinutes: number
  enabled: boolean
  onTimeout: () => void
}

export function useInactivityTimeout({ timeoutMinutes, enabled, onTimeout }: Options) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearInterval(warningTimerRef.current)
    setShowWarning(false)
    setCountdown(0)

    if (!enabled || timeoutMinutes <= 0) return

    const warningMs = (timeoutMinutes * 60 - 30) * 1000
    timerRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(30)
      warningTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(warningTimerRef.current!)
            warningTimerRef.current = null
            return 0
          }
          return prev - 1
        })
        if (warningTimerRef.current === null) {
          onTimeout()
        }
      }, 1000)
    }, Math.max(warningMs, 0))
  }, [timeoutMinutes, enabled, onTimeout])

  useEffect(() => {
    resetTimer()
    if (!enabled || timeoutMinutes <= 0) return

    const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll']
    const handler = () => resetTimer()
    for (const ev of events) {
      window.addEventListener(ev, handler)
    }
    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, handler)
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningTimerRef.current) clearInterval(warningTimerRef.current)
    }
  }, [resetTimer, enabled, timeoutMinutes])

  const dismissWarning = useCallback(() => {
    if (warningTimerRef.current) clearInterval(warningTimerRef.current)
    warningTimerRef.current = null
    setShowWarning(false)
    setCountdown(0)
    resetTimer()
  }, [resetTimer])

  return { showWarning, countdown, dismissWarning }
}
