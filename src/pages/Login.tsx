import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Leaf, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'

const loginSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少6位'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      await signIn(data.email, data.password)
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-between">
        <div className="page-hero mt-2">
          <div className="relative z-10">
            <p className="page-hero-kicker">Aquaculture Desk</p>
            <h1 className="page-hero-title">养殖场管理</h1>
            <p className="page-hero-description">把场所信息、养殖情况与尾水处理资料放进一个轻快、可靠的移动工作台。</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-primary-foreground/80">
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5" />
                <p className="mt-3 text-sm font-medium">资料更清晰</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Leaf className="h-5 w-5" />
                <p className="mt-3 text-sm font-medium">现场更从容</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="mt-5 overflow-hidden">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-5">
                <label className="app-label">邮箱</label>
                <Input type="email" {...register('email')} placeholder="请输入邮箱地址" autoCapitalize="none" />
                {errors.email ? <p className="app-error">{errors.email.message}</p> : null}
              </div>

              <div className="mb-6">
                <label className="app-label">密码</label>
                <Input type="password" {...register('password')} placeholder="请输入登录密码" />
                {errors.password ? <p className="app-error">{errors.password.message}</p> : null}
              </div>

              {error ? (
                <div className="mb-5 rounded-[1.35rem] border border-destructive/20 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '登录中...' : '进入工作台'}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="pb-4 pt-6 text-center text-xs text-muted-foreground">
          © 2024 养殖场管理系统
        </div>
      </div>
    </div>
  )
}
