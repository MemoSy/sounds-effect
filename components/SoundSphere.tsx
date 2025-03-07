// File: src/components/SoundSphere.tsx
'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Mesh } from 'three'

interface SoundSphereProps {
  audioData: number[]
}

const SoundSphere: React.FC<SoundSphereProps> = ({ audioData }) => {
  const meshRef = useRef<Mesh>(null)
  const originalPositions = useRef<Float32Array | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Create geometry only once - use icosahedron for better triangulation
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 3) // Lower detail to match image 2
    return geo
  }, [])
  
  // Store original positions for resetting
  useEffect(() => {
    if (meshRef.current && !isInitialized) {
      const positions = meshRef.current.geometry.getAttribute('position').array as Float32Array
      originalPositions.current = positions.slice()
      setIsInitialized(true)
    }
  }, [isInitialized])
  
  useFrame(() => {
    if (!meshRef.current || !originalPositions.current || !isInitialized) return
    
    const mesh = meshRef.current
    const positionAttribute = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = positionAttribute.array as Float32Array
    
    // Calculate average volume and detect if there's significant sound
    const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length
    const hasSound = average > 0.05
    
    if (hasSound) {
      // Create a spiky line-based effect similar to image 1
      const count = positionAttribute.count
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Get original position
        const originalX = originalPositions.current[i3]
        const originalY = originalPositions.current[i3 + 1]
        const originalZ = originalPositions.current[i3 + 2]
        
        // Calculate direction from center
        const length = Math.sqrt(
          originalX * originalX + 
          originalY * originalY + 
          originalZ * originalZ
        )
        
        const normalX = originalX / length
        const normalY = originalY / length
        const normalZ = originalZ / length
        
        // Find which frequency band impacts this vertex most (to create the line effect)
        const frequencyBand = Math.abs(Math.floor(Math.atan2(normalZ, normalX) * 10)) % audioData.length
        const intensity = audioData[frequencyBand] * 3.5
        
        // Apply a spiky distortion based on frequency data - creates line-like effect
        // Vary the intensity by position to create the line patterns
        const distortionFactor = 0.5 + Math.abs(Math.sin(normalX * 10 + normalY * 10)) * 1.5
        const finalIntensity = intensity * distortionFactor
        
        // Apply the distortion in the direction from center
        positions[i3] = originalX * (1 + finalIntensity)
        positions[i3 + 1] = originalY * (1 + finalIntensity)
        positions[i3 + 2] = originalZ * (1 + finalIntensity)
      }
    } else {
      // Reset to normal sphere (image 2) when no sound
      for (let i = 0; i < positionAttribute.count * 3; i++) {
        positions[i] = originalPositions.current[i]
      }
    }
    
    // Update the geometry
    positionAttribute.needsUpdate = true
    mesh.geometry.computeBoundingSphere()
    
    // Gentle rotation
    mesh.rotation.y += 0.001
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial 
        color="#ffffff" 
        wireframe={true}
        wireframeLinewidth={1}
      />
    </mesh>
  )
}

export default SoundSphere