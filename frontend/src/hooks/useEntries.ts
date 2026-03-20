import { useState, useEffect, useCallback } from 'react'
import { listEntries, Entry } from '../api/entries'

export function useEntries(params?: Record<string, string>) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listEntries(params)
      setEntries(res.data)
      setTotal(res.meta?.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { entries, loading, total, refetch: fetch }
}
