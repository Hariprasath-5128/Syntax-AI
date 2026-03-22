// App.jsx - Main Application Entry
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';
import './styles.css';

export default function App() {
  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ 
          antialias: true,
          toneMapping: 2, // ACESFilmic
          toneMappingExposure: 1.2
        }}
      >
        <color attach="background" args={['#000000']} />
        <Experience />
      </Canvas>
    </div>
  );
}
