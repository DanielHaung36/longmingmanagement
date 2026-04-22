import { memo } from "react";
import type { FC, ReactNode } from "react";
import { Outlet } from "react-router-dom";


export interface IProps {
  children?: ReactNode;
  //...这里定义相关类型
  //扩展相关属性
}

const AuthLayout: FC<IProps> = memo(function ({ children }) {
  return (
    <div className="authlayout">
  
          {/* Outlet 会渲染对应的子路由页面：LoginPage / RegisterPage / PasswordResetPage */}
          <Outlet />
          {children}
    </div>
  );
});

export default AuthLayout;
AuthLayout.displayName = "AuthLayout"; //方便以后调试使用
