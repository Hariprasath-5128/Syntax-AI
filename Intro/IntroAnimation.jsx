import React, { useEffect, useRef, useState } from 'react';
import './IntroAnimation.css';

const IntroAnimation = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [animationStage, setAnimationStage] = useState('typing');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const codeLines = [
      { text: 'function generateCode() {', color: '#0000FF' },
      { text: '  const syntaxAI = new Agent({', color: '#0000FF' },
      { text: '    model: "gemini-2.0-flash",', color: '#A31515' },
      { text: '    apiKey: process.env.API_KEY', color: '#795E26' },
      { text: '  });', color: '#000000' },
      { text: '  return syntaxAI.run(prompt);', color: '#AF00DB' },
      { text: '}', color: '#000000' },
      { text: '', color: '#000000' },
      { text: 'async function refactorCode(input) {', color: '#0000FF' },
      { text: '  try {', color: '#AF00DB' },
      { text: '    const response = await api.process(input);', color: '#000000' },
      { text: '    console.log("Code refactored successfully");', color: '#A31515' },
      { text: '    return response.data;', color: '#AF00DB' },
      { text: '  } catch (error) {', color: '#AF00DB' },
      { text: '    console.error("Error:", error);', color: '#A31515' },
      { text: '  }', color: '#000000' },
      { text: '}', color: '#000000' },
      { text: '', color: '#000000' },
      { text: 'export default App;', color: '#0000FF' },
      { text: '// Powered by Syntax AI', color: '#008000' }
    ];

    const lineHeight = 30;
    const fontSize = 18;
    const startX = 50;
    const startY = 50;
    let currentLine = 0;
    let currentChar = 0;
    let startTime = Date.now();
    let animationId;
    const particles = [];
    const allChars = [];

    // Calculate 3D sphere positions
    const calculateSpherePositions = (numParticles, radius, centerX, centerY) => {
      const positions = [];
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

      for (let i = 0; i < numParticles; i++) {
        // Fibonacci sphere distribution
        const y = 1 - (i / (numParticles - 1)) * 2; // y from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        // Convert 3D to 2D with perspective
        const scale = 1 + z * 0.3; // Perspective scaling
        const screenX = centerX + x * radius * scale;
        const screenY = centerY + y * radius * scale;
        
        // Calculate depth for layering (z coordinate)
        const depth = z; // -1 (back) to 1 (front)

        positions.push({
          x: screenX,
          y: screenY,
          z: depth,
          scale: scale,
          index: i
        });
      }

      // Sort by depth (back to front for proper rendering)
      return positions.sort((a, b) => a.z - b.z);
    };

    // Line-by-line typing animation
    const typeCode = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "Consolas", "Courier New", monospace`;

      // Draw completed lines
      for (let i = 0; i < currentLine; i++) {
        ctx.fillStyle = codeLines[i].color;
        ctx.fillText(codeLines[i].text, startX, startY + i * lineHeight);
      }

      // Draw current typing line
      if (currentLine < codeLines.length) {
        const line = codeLines[currentLine];
        const typedText = line.text.substring(0, currentChar);
        ctx.fillStyle = line.color;
        ctx.fillText(typedText, startX, startY + currentLine * lineHeight);

        // Blinking cursor
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          const cursorX = startX + ctx.measureText(typedText).width;
          ctx.fillStyle = '#000000';
          ctx.fillRect(cursorX, startY + currentLine * lineHeight - fontSize, 2, fontSize);
        }

        // Store character positions
        for (let i = 0; i < currentChar; i++) {
          const char = line.text[i];
          const charX = startX + ctx.measureText(line.text.substring(0, i)).width;
          const charY = startY + currentLine * lineHeight;
          
          if (!allChars.find(c => c.x === charX && c.y === charY)) {
            allChars.push({
              char: char,
              x: charX,
              y: charY,
              color: line.color
            });
          }
        }

        // Typing speed
        const elapsed = Date.now() - startTime;
        const typingSpeed = 30;
        const expectedChar = Math.floor(elapsed / typingSpeed);
        
        if (expectedChar > currentChar) {
          currentChar++;
        }

        // Move to next line
        if (currentChar > line.text.length) {
          currentLine++;
          currentChar = 0;
        }
      } else {
        // All lines typed
        if (Date.now() - startTime > 2000 && particles.length === 0) {
          setAnimationStage('pitchout');
          
          // Calculate 3D sphere positions
          const sphereRadius = 100;
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const spherePositions = calculateSpherePositions(
            allChars.filter(c => c.char.trim()).length,
            sphereRadius,
            centerX,
            centerY
          );
          
          // Assign each character to a sphere position with sequential delay
          let posIndex = 0;
          allChars.forEach((charData, index) => {
            if (charData.char.trim() && posIndex < spherePositions.length) {
              const pos = spherePositions[posIndex];
              particles.push({
                char: charData.char,
                x: charData.x,
                y: charData.y,
                originalColor: charData.color,
                targetX: pos.x,
                targetY: pos.y,
                z: pos.z,
                scale: pos.scale,
                speed: 0.08 + Math.random() * 0.04,
                startDelay: index * 8, // Sequential: 8ms between each character
                started: false,
                arrived: false
              });
              posIndex++;
            }
          });
        }
      }
    };

    // Characters fly one by one to form 3D sphere
    const formSphereOneByOne = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const elapsed = Date.now() - startTime - 2000;
      let allArrived = true;

      // Sort by z-depth for proper 3D rendering
      const sortedParticles = [...particles].sort((a, b) => a.z - b.z);

      sortedParticles.forEach(p => {
        // Check if this character should start moving
        if (elapsed < p.startDelay) {
          // Still at original position
          ctx.fillStyle = p.originalColor;
          ctx.font = `${fontSize}px "Consolas", monospace`;
          ctx.fillText(p.char, p.x, p.y);
          allArrived = false;
          return;
        }

        if (!p.started) {
          p.started = true;
        }

        // Calculate movement
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 3) {
          allArrived = false;
          p.x += dx * p.speed;
          p.y += dy * p.speed;
        } else {
          p.x = p.targetX;
          p.y = p.targetY;
          p.arrived = true;
        }

        // Color transition to golden
        const progress = 1 - Math.min(distance / 500, 1);
        const r = 255;
        const g = Math.floor(215 * progress + 50 * (1 - progress));
        const b = Math.floor(0 * progress + 50 * (1 - progress));
        
        // 3D depth effects
        const depthOpacity = 0.5 + (p.z + 1) * 0.25; // 0.5 to 1.0 based on depth
        const depthScale = p.scale;
        const charSize = fontSize * depthScale;

        ctx.globalAlpha = depthOpacity;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.font = `${charSize}px "Consolas", monospace`;
        ctx.fillText(p.char, p.x, p.y);
        ctx.globalAlpha = 1;
      });

      // Add subtle glow when sphere is forming
      if (elapsed > 500) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const gradient = ctx.createRadialGradient(
          centerX, centerY, 60,
          centerX, centerY, 140
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.globalCompositeOperation = 'destination-over';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      if (allArrived && elapsed > 3000) {
        setAnimationStage('bat');
      }
    };

    // Animation loop
    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (animationStage === 'typing') {
        typeCode();
      } else if (animationStage === 'pitchout') {
        formSphereOneByOne();
      } else if (animationStage === 'bat' && elapsed > 5500) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (animationStage === 'fly' && elapsed > 6500) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (elapsed > 7500) {
        cancelAnimationFrame(animationId);
        setTimeout(() => {
          setAnimationStage('complete');
          if (onComplete) onComplete();
        }, 500);
        return;
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [onComplete, animationStage]);

  return (
    <div className="intro-container light-theme">
      <canvas ref={canvasRef} className="intro-canvas"></canvas>
      
      {animationStage === 'bat' && (
        <>
          <div className="baseball-bat"></div>
          <div className="character-sphere"></div>
        </>
      )}
      
      {animationStage === 'fly' && (
        <>
          <div className="character-sphere flying"></div>
          <div className="logo-reveal light">
            <h1>Syntax A<span className="i-letter">i</span></h1>
          </div>
        </>
      )}

      {animationStage === 'complete' && (
        <div className="logo-final light">
          <h1>Syntax A<span className="i-letter">i<span className="i-dot golden-dot"></span></span></h1>
        </div>
      )}
    </div>
  );
};

export default IntroAnimation;
