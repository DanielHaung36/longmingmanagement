/* 'use client' */
import DashboardWrapper from './dashboardWrapper'
type Props = {
  children?: React.ReactNode
}

const MainLayout = ({ children }: Props) => {
  return (
    <div className="">
      <DashboardWrapper>{children}</DashboardWrapper>
    </div>
  )
}

export default MainLayout
