import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: any) {
    e.preventDefault()
    setError('')

    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password)

    if (result.error) {
      setError(result.error.message)
      return
    }

    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">JANGO3D</h1>
        <p className="text-zinc-400 mb-8">{isLogin ? 'Acesse sua conta' : 'Crie sua conta'}</p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Seu email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Sua senha"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="w-full rounded-xl bg-white text-black font-semibold py-3">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </div>

        <button type="button" onClick={() => setIsLogin(!isLogin)} className="mt-6 text-zinc-400 text-sm">
          {isLogin ? 'Não possui conta? Cadastre-se' : 'Já possui conta? Entrar'}
        </button>

        <div className="mt-8">
          <Link to="/" className="text-zinc-500 text-sm">Voltar para home</Link>
        </div>
      </form>
    </div>
  )
}
