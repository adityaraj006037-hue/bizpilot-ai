import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useLeads(filters = {}) {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.stage) {
        query = query.eq('status', filters.stage)
      }

      if (filters.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        )
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, filters.stage, filters.search, filters.limit])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
      }, () => {
        fetchLeads()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}

export default useLeads
