import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-emerald-600 text-white px-5 py-6 flex-shrink-0">
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-primary-100 text-sm mt-1">管理您的账户</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-emerald-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="ml-4 flex-1">
              <p className="font-semibold text-gray-900 text-lg truncate">
                {user?.email || '未知用户'}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                ID: {user?.id?.slice(0, 8) || '------'}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-medium">版本</p>
              <p className="text-sm text-gray-400">v1.0.0</p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">最新</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4 mt-8 bg-white rounded-2xl text-red-500 font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出登录
        </button>

        <p className="text-center text-xs text-gray-300 mt-4">
          养殖场管理 v1.0.0
        </p>
      </div>
    </div>
  )
}
