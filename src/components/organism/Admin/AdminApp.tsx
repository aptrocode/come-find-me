import { useEffect, Suspense } from 'react'
import { useAdminStore } from '../../../store/useAdminStore'
import AdminPage from './AdminPage'

export default function AdminApp() {
  const loadAdminConfig = useAdminStore(s => s.loadAdminConfig)

  useEffect(() => {
    // Poll admin config every 10 seconds just in case, though mostly we generate it here
    loadAdminConfig()
  }, [loadAdminConfig])

  // Simple boundary
  return (
    <div className="admin-app">
      <Suspense fallback={<div style={{color: 'white', padding: 20}}>Loading Admin...</div>}>
        <AdminPage />
      </Suspense>
    </div>
  )
}
