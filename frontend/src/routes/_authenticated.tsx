import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { AuthService } from '@/lib/AuthService'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!AuthService.isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    AuthService.logout()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onLogout={handleLogout} />
      <div className="flex min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
