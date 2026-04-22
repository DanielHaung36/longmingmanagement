'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'
/* 'use client' */
type Props = {
  children?: React.ReactNode
}

const PageTransitionManager = ({ children }: Props) => {
  const pathname = usePathname()

  return (
    <Suspense>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0.9, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.9, scale: 0.99 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Suspense>
  )
}

export default PageTransitionManager
