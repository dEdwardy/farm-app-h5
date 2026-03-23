import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
    <div className="h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-primary-500/30">
            <span className="text-5xl">🐟</span>
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">养殖场管理</h1>
          <p className="text-primary-100 mt-3 text-lg">智能水产养殖管理专家</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-primary-900/20">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">邮箱</label>
            <input
              type="email"
              {...register('email')}
              placeholder="请输入邮箱"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200 bg-white/80"
              autoCapitalize="none"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">密码</label>
            <input
              type="password"
              {...register('password')}
              placeholder="请输入密码"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200 bg-white/80"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 transition-all duration-200"
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>
      </div>

      <div className="p-6 text-center">
        <p className="text-primary-100/80 text-xs">© 2024 养殖场管理系统</p>
      </div>
    </div>
  )
}
