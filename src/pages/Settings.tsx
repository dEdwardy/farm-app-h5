import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeInfo, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { showErrorToast } from '../utils/errorHandler'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      setShowLogoutConfirm(false)
      navigate('/login')
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="app-page">
      <div className="app-scroll space-y-4">
        <PageHeader
          eyebrow="Workspace"
          title="设置"
          description="查看当前账号和系统版本，保持移动端工作台处于稳定状态。"
        />

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><UserRound className="h-5 w-5" /></div>
            <div>
              <CardTitle>当前账号</CardTitle>
              <CardDescription>用于识别当前登录用户与账户状态。</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-xl font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-foreground">{user?.email || '未知用户'}</p>
                <p className="mt-1 text-sm text-muted-foreground">ID: {user?.id?.slice(0, 8) || '------'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="section-heading-icon"><BadgeInfo className="h-5 w-5" /></div>
            <div>
              <CardTitle>应用信息</CardTitle>
              <CardDescription>当前版本与运行状态概览。</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-[1.2rem] border border-border/70 bg-white/78 px-4 py-3.5 shadow-sm">
              <div>
                <p className="text-[0.82rem] uppercase tracking-[0.18em] text-muted-foreground">Application</p>
                <p className="mt-2 text-base font-semibold text-foreground">养殖场管理系统</p>
              </div>
              <span className="chip">最新版本</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.2rem] border border-border/70 bg-white/72 px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">版本号</p>
                <p className="mt-2 text-lg font-semibold text-foreground">v1.0.0</p>
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-white/72 px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">状态</p>
                <p className="mt-2 text-lg font-semibold text-[#547060]">运行正常</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="button" variant="destructive" size="lg" className="w-full" onClick={() => setShowLogoutConfirm(true)}>
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>

        <p className="pb-4 text-center text-xs text-muted-foreground">养殖场管理 v1.0.0</p>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="退出登录"
        message="确定要退出当前账号吗？退出后需要重新登录才能继续使用。"
        confirmText="退出登录"
        busyText="退出中..."
        danger
        busy={isSigningOut}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
