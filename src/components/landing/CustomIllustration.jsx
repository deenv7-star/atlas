import React from 'react';
import { motion } from 'framer-motion';

export default function CustomIllustration({ type }) {
  if (type === 'solution') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative w-full max-w-lg mx-auto h-[500px]"
      >
        <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD89C" />
              <stop offset="100%" stopColor="#F2E9DB" />
            </linearGradient>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0F7F5" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
          </defs>
          
          {/* Sky background */}
          <rect width="500" height="500" fill="url(#skyGrad)" opacity="0.3"/>
          
          {/* Sun */}
          <motion.circle
            cx="400" cy="100" r="50"
            fill="url(#sunGrad)"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            return (
              <motion.line
                key={i}
                x1={400 + 60 * Math.cos(angle)}
                y1={100 + 60 * Math.sin(angle)}
                x2={400 + 75 * Math.cos(angle)}
                y2={100 + 75 * Math.sin(angle)}
                stroke="#FFD89C"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
              />
            );
          })}
          
          {/* Friendly house */}
          <g>
            {/* House body */}
            <rect x="150" y="250" width="200" height="180" rx="8" fill="#0B1220" opacity="0.9"/>
            
            {/* Roof */}
            <path d="M140 250 L250 180 L360 250 Z" fill="#00D1C1"/>
            
            {/* Chimney with smoke */}
            <rect x="300" y="200" width="20" height="50" rx="4" fill="#0B1220"/>
            {[...Array(3)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx={310}
                cy={180 - i * 15}
                rx={8 + i * 2}
                ry={6 + i * 2}
                fill="#F2E9DB"
                opacity="0.6"
                animate={{ 
                  cy: [180 - i * 15, 160 - i * 15],
                  opacity: [0.6, 0]
                }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            ))}
            
            {/* Door */}
            <rect x="220" y="350" width="60" height="80" rx="30" fill="#F2E9DB"/>
            <circle cx="265" cy="390" r="4" fill="#00D1C1"/>
            
            {/* Windows with warm light */}
            <rect x="170" y="280" width="50" height="50" rx="8" fill="#FFD89C" opacity="0.8"/>
            <line x1="195" y1="280" x2="195" y2="330" stroke="#0B1220" strokeWidth="2"/>
            <line x1="170" y1="305" x2="220" y2="305" stroke="#0B1220" strokeWidth="2"/>
            
            <rect x="280" y="280" width="50" height="50" rx="8" fill="#FFD89C" opacity="0.8"/>
            <line x1="305" y1="280" x2="305" y2="330" stroke="#0B1220" strokeWidth="2"/>
            <line x1="280" y1="305" x2="330" y2="305" stroke="#0B1220" strokeWidth="2"/>
            
            <motion.rect 
              x="220" y="280" width="60" height="40" rx="8" 
              fill="#FFD89C"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </g>
          
          {/* Garden elements */}
          <ellipse cx="100" cy="430" rx="60" ry="20" fill="#00D1C1" opacity="0.2"/>
          <ellipse cx="380" cy="430" rx="70" ry="25" fill="#00D1C1" opacity="0.2"/>
          
          {/* Trees */}
          <g>
            <rect x="70" y="350" width="15" height="80" rx="4" fill="#0B1220" opacity="0.7"/>
            <motion.ellipse 
              cx="77" cy="340" rx="40" ry="45" 
              fill="#00D1C1"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <ellipse cx="60" cy="330" rx="25" ry="30" fill="#00D1C1" opacity="0.8"/>
            <ellipse cx="95" cy="330" rx="25" ry="30" fill="#00D1C1" opacity="0.8"/>
          </g>
          
          <g>
            <rect x="400" y="370" width="12" height="60" rx="3" fill="#0B1220" opacity="0.7"/>
            <motion.ellipse 
              cx="406" cy="360" rx="35" ry="40" 
              fill="#F2E9DB"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 6, delay: 1, repeat: Infinity }}
            />
            <ellipse cx="390" cy="350" rx="20" ry="25" fill="#F2E9DB" opacity="0.8"/>
            <ellipse cx="422" cy="350" rx="20" ry="25" fill="#F2E9DB" opacity="0.8"/>
          </g>
          
          {/* Flying birds */}
          {[0, 1, 2].map((i) => (
            <motion.g
              key={i}
              animate={{ 
                x: [-50, 550],
                y: [100 + i * 30, 80 + i * 30]
              }}
              transition={{ 
                duration: 15 + i * 2,
                delay: i * 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <path 
                d="M0 0 Q -5 -3 -10 0 M0 0 Q 5 -3 10 0" 
                stroke="#0B1220" 
                strokeWidth="2" 
                strokeLinecap="round"
                opacity="0.3"
              />
            </motion.g>
          ))}
          
          {/* Floating hearts */}
          {[...Array(4)].map((_, i) => (
            <motion.path
              key={i}
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#00D1C1"
              opacity="0.2"
              transform={`translate(${80 + i * 100}, ${150 + i * 50}) scale(0.8)`}
              animate={{ 
                y: [-10, 10, -10],
                rotate: [0, 10, 0, -10, 0]
              }}
              transition={{ duration: 4, delay: i * 0.5, repeat: Infinity }}
            />
          ))}
        </svg>
      </motion.div>
    );
  }

  if (type === 'features') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative w-full max-w-md h-80 mx-auto"
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Calendar pages spreading out */}
          <g>
            {/* Center calendar */}
            <motion.g
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <rect x="150" y="150" width="100" height="120" rx="8" fill="#0B1220"/>
              <rect x="150" y="150" width="100" height="25" rx="8" fill="#00D1C1"/>
              <rect x="165" y="185" width="25" height="20" rx="4" fill="#F2E9DB"/>
              <rect x="195" y="185" width="25" height="20" rx="4" fill="#F2E9DB"/>
              <rect x="225" y="185" width="20" height="20" rx="4" fill="#F2E9DB"/>
              <rect x="165" y="215" width="25" height="20" rx="4" fill="#F2E9DB"/>
              <rect x="195" y="215" width="25" height="20" rx="4" fill="#FFD89C"/>
              <rect x="225" y="215" width="20" height="20" rx="4" fill="#F2E9DB"/>
            </motion.g>
            
            {/* Left page - messages */}
            <motion.g
              animate={{ 
                x: [-10, 0, -10],
                rotate: [-5, 0, -5]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ transformOrigin: '80px 200px' }}
            >
              <rect x="50" y="170" width="90" height="110" rx="8" fill="#F2E9DB"/>
              <circle cx="70" cy="195" r="12" fill="#00D1C1"/>
              <rect x="90" y="188" width="35" height="4" rx="2" fill="#0B1220" opacity="0.3"/>
              <rect x="90" y="198" width="25" height="3" rx="1.5" fill="#0B1220" opacity="0.2"/>
              
              <ellipse cx="80" cy="235" rx="20" ry="12" fill="#00D1C1" opacity="0.3"/>
              <rect x="65" y="225" width="30" height="20" rx="8" fill="#00D1C1"/>
            </motion.g>
            
            {/* Right page - payments */}
            <motion.g
              animate={{ 
                x: [10, 0, 10],
                rotate: [5, 0, 5]
              }}
              transition={{ duration: 4.5, repeat: Infinity }}
              style={{ transformOrigin: '310px 200px' }}
            >
              <rect x="260" y="170" width="90" height="110" rx="8" fill="#FFD89C"/>
              <rect x="275" y="190" width="60" height="35" rx="6" fill="#0B1220" opacity="0.8"/>
              <rect x="283" y="205" width="15" height="10" rx="3" fill="#00D1C1"/>
              <circle cx="318" cy="210" r="3" fill="#F2E9DB"/>
              
              <text x="285" y="255" fill="#0B1220" fontSize="24" fontWeight="bold">₪</text>
            </motion.g>
          </g>
          
          {/* Connecting hearts/lines */}
          <motion.path
            d="M140 200 Q 100 180 80 200"
            stroke="#00D1C1"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            animate={{ strokeDashoffset: [0, -16] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            opacity="0.4"
          />
          
          <motion.path
            d="M260 200 Q 280 180 310 200"
            stroke="#00D1C1"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            animate={{ strokeDashoffset: [0, -16] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            opacity="0.4"
          />
          
          {/* Decorative sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.g
              key={i}
              animate={{ 
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            >
              <path
                d={`M${120 + i * 40} ${100 + (i % 3) * 80} l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z`}
                fill="#00D1C1"
                opacity="0.5"
              />
            </motion.g>
          ))}
        </svg>
      </motion.div>
    );
  }

  if (type === 'workflow') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative w-full max-w-md h-80 mx-auto"
      >
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Path with dotted line */}
          <motion.path
            d="M70 120 Q 150 80 200 120 T 330 120"
            stroke="#00D1C1"
            strokeWidth="3"
            strokeDasharray="6 6"
            fill="none"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            opacity="0.4"
          />
          
          {/* Step 1 - Lead comes in */}
          <motion.g
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <circle cx="70" cy="120" r="40" fill="#F2E9DB"/>
            <circle cx="70" cy="120" r="32" fill="#0B1220"/>
            
            {/* Phone icon */}
            <rect x="60" y="110" width="20" height="26" rx="3" fill="#00D1C1"/>
            <rect x="62" y="112" width="16" height="20" rx="1" fill="#F2E9DB"/>
            <circle cx="70" cy="134" r="2" fill="#00D1C1"/>
            
            <text x="70" y="180" textAnchor="middle" fill="#0B1220" fontSize="16" fontWeight="600">1</text>
          </motion.g>
          
          {/* Step 2 - Processing */}
          <motion.g
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ transformOrigin: '200px 120px' }}
          >
            <circle cx="200" cy="120" r="45" fill="#00D1C1"/>
            <circle cx="200" cy="120" r="36" fill="white"/>
            
            {/* Checkmark forming */}
            <motion.path
              d="M185 120 L195 130 L215 108"
              stroke="#0B1220"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              animate={{ pathLength: [0, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            <text x="200" y="190" textAnchor="middle" fill="#0B1220" fontSize="16" fontWeight="600">2</text>
          </motion.g>
          
          {/* Step 3 - Success */}
          <motion.g
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, delay: 0.5, repeat: Infinity }}
          >
            <circle cx="330" cy="120" r="40" fill="#FFD89C"/>
            <circle cx="330" cy="120" r="32" fill="#0B1220"/>
            
            {/* Happy emoji */}
            <circle cx="322" cy="115" r="3" fill="#00D1C1"/>
            <circle cx="338" cy="115" r="3" fill="#00D1C1"/>
            <path 
              d="M320 128 Q 330 133 340 128" 
              stroke="#00D1C1" 
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
            />
            
            <text x="330" y="180" textAnchor="middle" fill="#0B1220" fontSize="16" fontWeight="600">3</text>
          </motion.g>
          
          {/* Celebration confetti */}
          {[...Array(8)].map((_, i) => (
            <motion.rect
              key={i}
              x={310 + (i % 3) * 15}
              y={60 + Math.floor(i / 3) * 15}
              width="4"
              height="8"
              rx="2"
              fill={i % 2 === 0 ? "#00D1C1" : "#FFD89C"}
              animate={{ 
                y: [60 + Math.floor(i / 3) * 15, 90 + Math.floor(i / 3) * 15],
                rotate: [0, 360],
                opacity: [1, 0]
              }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
        </svg>
      </motion.div>
    );
  }

  if (type === 'cta') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative w-full max-w-md mx-auto h-[500px]"
      >
        <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="skyGradCta" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0F7F5" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
          </defs>
          
          {/* Sky */}
          <rect width="400" height="500" fill="url(#skyGradCta)" opacity="0.5"/>
          
          {/* Clouds */}
          {[
            { x: 50, y: 80, scale: 0.8 },
            { x: 250, y: 120, scale: 1 },
            { x: 320, y: 60, scale: 0.6 }
          ].map((cloud, i) => (
            <motion.g
              key={i}
              animate={{ x: [-20, 20, -20] }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ellipse 
                cx={cloud.x} 
                cy={cloud.y} 
                rx={30 * cloud.scale} 
                ry={20 * cloud.scale} 
                fill="white" 
                opacity="0.6"
              />
              <ellipse 
                cx={cloud.x + 20 * cloud.scale} 
                cy={cloud.y} 
                rx={25 * cloud.scale} 
                ry={18 * cloud.scale} 
                fill="white" 
                opacity="0.6"
              />
              <ellipse 
                cx={cloud.x + 10 * cloud.scale} 
                cy={cloud.y - 10 * cloud.scale} 
                rx={20 * cloud.scale} 
                ry={15 * cloud.scale} 
                fill="white" 
                opacity="0.6"
              />
            </motion.g>
          ))}
          
          {/* Hot air balloon */}
          <motion.g
            animate={{ 
              y: [-15, 15, -15],
              x: [-5, 5, -5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Balloon */}
            <ellipse cx="200" cy="200" rx="80" ry="100" fill="#00D1C1" opacity="0.9"/>
            <ellipse cx="180" cy="200" rx="30" ry="100" fill="#0B1220" opacity="0.2"/>
            <ellipse cx="220" cy="200" rx="30" ry="100" fill="#FFD89C" opacity="0.3"/>
            
            {/* Basket */}
            <rect x="180" y="310" width="40" height="35" rx="4" fill="#0B1220" opacity="0.8"/>
            <line x1="180" y1="320" x2="220" y2="320" stroke="#F2E9DB" strokeWidth="1"/>
            <line x1="180" y1="330" x2="220" y2="330" stroke="#F2E9DB" strokeWidth="1"/>
            
            {/* People in basket */}
            <circle cx="190" cy="325" r="6" fill="#FFD89C"/>
            <circle cx="210" cy="325" r="6" fill="#F2E9DB"/>
            
            {/* Ropes */}
            <path d="M180 310 Q 170 280 180 200" stroke="#0B1220" strokeWidth="2" opacity="0.3"/>
            <path d="M220 310 Q 230 280 220 200" stroke="#0B1220" strokeWidth="2" opacity="0.3"/>
            
            {/* Flag on top */}
            <motion.g
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ transformOrigin: '200px 100px' }}
            >
              <line x1="200" y1="100" x2="200" y2="130" stroke="#0B1220" strokeWidth="2"/>
              <path d="M200 100 L230 110 L200 120 Z" fill="#00D1C1"/>
            </motion.g>
          </motion.g>
          
          {/* Sun */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '350px 80px' }}
          >
            <circle cx="350" cy="80" r="35" fill="#FFD89C"/>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              return (
                <line
                  key={i}
                  x1={350 + 45 * Math.cos(angle)}
                  y1={80 + 45 * Math.sin(angle)}
                  x2={350 + 55 * Math.cos(angle)}
                  y2={80 + 55 * Math.sin(angle)}
                  stroke="#FFD89C"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </motion.g>
          
          {/* Birds */}
          {[...Array(5)].map((_, i) => (
            <motion.path
              key={i}
              d="M0 0 Q -4 -2 -8 0 M0 0 Q 4 -2 8 0"
              stroke="#0B1220"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
              animate={{ 
                x: [-50 + i * 30, 450],
                y: [150 + i * 20, 130 + i * 20]
              }}
              transition={{ 
                duration: 12 + i,
                delay: i * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
          
          {/* Ground with grass */}
          <ellipse cx="200" cy="480" rx="180" ry="30" fill="#00D1C1" opacity="0.2"/>
          {[...Array(20)].map((_, i) => (
            <motion.line
              key={i}
              x1={30 + i * 18}
              y1={460}
              x2={30 + i * 18}
              y2={470}
              stroke="#00D1C1"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ 
                y2: [470, 475, 470],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
            />
          ))}
          
          {/* Hearts floating up */}
          {[...Array(3)].map((_, i) => (
            <motion.path
              key={i}
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#00D1C1"
              opacity="0.3"
              transform={`translate(${100 + i * 80}, ${350}) scale(0.6)`}
              animate={{ 
                y: [0, -100],
                opacity: [0.3, 0]
              }}
              transition={{ duration: 4, delay: i * 1.5, repeat: Infinity }}
            />
          ))}
        </svg>
      </motion.div>
    );
  }

  return null;
}