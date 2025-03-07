// File: src/components/SoundVisualizer.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import SoundSphere from './SoundSphere'
import FrequencyRing from './FrequencyRing'
import AudioAnalyzer from './AudioAnalyzer'

const SoundVisualizer = () => {
  const [isListening, setIsListening] = useState(false)
  const [audioData, setAudioData] = useState<number[]>(new Array(128).fill(0))
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [showStatus, setShowStatus] = useState(false)
  
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    audioAnalyzerRef.current = new AudioAnalyzer()
    
    return () => {
      if (isListening) {
        audioAnalyzerRef.current?.stop()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const updateAudioData = () => {
      if (isListening && audioAnalyzerRef.current) {
        const newData = audioAnalyzerRef.current.getAudioData()
        setAudioData(newData)
      }
      animationRef.current = requestAnimationFrame(updateAudioData)
    }
    
    if (isListening) {
      updateAudioData()
    } else {
      // Reset to zeros when not listening
      setAudioData(new Array(128).fill(0))
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isListening])

  const startListening = async () => {
    try {
      await audioAnalyzerRef.current?.start()
      setIsListening(true)
      setError(null)
      showStatusMessage('Microphone active')
    } catch (err) {
      console.error("Microphone error:", err)
      if (err instanceof Error) {
        setError(err.message)
        showStatusMessage(`Error: ${err.message}`)
      } else {
        setError('Failed to access microphone')
        showStatusMessage('Failed to access microphone')
      }
    }
  }

  const stopListening = () => {
    audioAnalyzerRef.current?.stop()
    setIsListening(false)
    setAudioData(new Array(128).fill(0))
    showStatusMessage('Microphone disabled')
  }

  const showStatusMessage = (message: string) => {
    setStatusMessage(message)
    setShowStatus(true)
    setTimeout(() => setShowStatus(false), 3000)
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#000000'))
        }}
      >
        {/* Main sound sphere visualization */}
        <SoundSphere audioData={audioData} />
        
        {/* New frequency ring visualization */}
        <FrequencyRing audioData={audioData} />
      </Canvas>
      
      <div className={`status ${showStatus ? 'visible' : ''}`}>
        {statusMessage}
      </div>
      
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-70">
        {isListening ? 'Microphone enabled' : 'Microphone disabled'}
      </div>
      
      <div className="controls">
        {!isListening ? (
          <button onClick={startListening} className="px-4 py-2 bg-blue-600 text-white rounded">
            Start Listening
          </button>
        ) : (
          <button onClick={stopListening} className="px-4 py-2 bg-red-600 text-white rounded">
            Stop Listening
          </button>
        )}
      </div>
    </div>
  )
}

export default SoundVisualizer