// File: src/components/FrequencyRing.tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface FrequencyRingProps {
  audioData: number[]
}

const FrequencyRing: React.FC<FrequencyRingProps> = ({ audioData }) => {
  const bars = 64 // Number of frequency bars to display
  
  // Optimize by creating geometries once
  const barGeometry = useMemo(() => new THREE.BoxGeometry(0.05, 1, 0.05), [])
  
  return (
    <group position={[0, 0, 0]}>
      {Array.from({ length: bars }).map((_, i) => {
        const angle = (i / bars) * Math.PI * 2
        const x = Math.cos(angle) * 2.2 // Positioning in a circle
        const z = Math.sin(angle) * 2.2
        
        // Use subset of audio data for this bar
        const dataIndex = Math.floor((i / bars) * audioData.length)
        const height = audioData[dataIndex] * 1.5
        
        return (
          <mesh 
            key={i} 
            position={[x, 0, z]} 
            rotation={[0, -angle + Math.PI/2, 0]}
            scale={[1, Math.max(0.01, height), 1]}
          >
            <primitive object={barGeometry} />
            <meshBasicMaterial 
              color={new THREE.Color(`hsl(${210 + height * 150}, 100%, ${50 + height * 50}%)`)} 
            />
          </mesh>
        )
      })}
    </group>
  )
}

export default FrequencyRing