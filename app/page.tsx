import SoundVisualizer from '@/components/SoundVisualizer'
import dynamic from 'next/dynamic'

// // Dynamically import the SoundVisualizer component with no SSR
// const SoundVisualizer = dynamic(() => import('@/components/SoundVisualizer'), {
//   ssr: false,
// })

export default function Home() {
  return <SoundVisualizer />
}