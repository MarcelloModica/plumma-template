import { LogOut } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '@/components/layout/language-selector'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthService } from '@/lib/AuthService'

interface HeaderProps {
  onLogout: () => void
}

function getUserInitials(username: string): string {
  const trimmed = username.trim()
  if (!trimmed) {
    return '??'
  }

  const parts = trimmed.split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }

  return trimmed.slice(0, 2).toUpperCase()
}

export function Header({ onLogout }: HeaderProps) {
  const { t } = useTranslation()
  const userInfo = AuthService.getSecurityInfoFromStorage()?.userInfo
  const userName = userInfo?.userName ?? ''
  const userRole = userInfo?.userRoles?.[0] ?? ''
  const displayName = userName || t('header.defaultUser')
  const initials = userName ? getUserInitials(userName) : '??'

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3.5">
      <Link
        to="/dashboard"
        className="font-semibold text-lg tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        aria-label={t('header.goToDashboard')}
      >
        {t('common.appName')}
      </Link>

      <div className="flex items-center gap-3">
        <LanguageSelector />

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t('header.userMenu', { name: displayName })}
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar className="size-10 cursor-pointer border">
              <AvatarFallback className="bg-muted text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-60">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              {userRole ? (
                <p className="text-xs text-muted-foreground">{userRole}</p>
              ) : null}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={onLogout}
            >
              <LogOut />
              {t('header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
