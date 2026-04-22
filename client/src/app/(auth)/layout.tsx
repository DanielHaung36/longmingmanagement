
import PageTransitionManager from '@/components/motion/PageTransitionManager'

type Props = {
  children?: React.ReactNode
}

const AuthLayout = ({ children }: Props) => {
  return <PageTransitionManager>{children}</PageTransitionManager>
}

export default AuthLayout
