import { memo, useState, useEffect } from "react";
import type { FC, ReactNode } from "react";
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { login, logout } from './authSlice'
export interface IProps {
  children?: ReactNode;
}

const LoginSimple: FC<IProps> = memo(function ({ children }) {
  const dispatch = useAppDispatch()
  const { loading, error, token } = useAppSelector(state => state.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    dispatch(login({ username, password }))
  }
  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div>
      {token ? (
        <>
          <p>已登录，Token：{token}</p>
          <button onClick={handleLogout}>登出</button>
        </>
      ) : (
        <>
          <input value={username} onChange={e => setUsername(e.target.value)} />
          <input value={password} type="password" onChange={e => setPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </>
      )}
    </div>
  )
});

export default LoginSimple;
LoginSimple.displayName = "LoginSimple";
