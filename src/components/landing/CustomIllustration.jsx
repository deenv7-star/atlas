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
            <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B1220" />
              <stop offset="100%" stopColor="#1a2744" />
            </linearGradient>
            <linearGradient id="aquaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D1C1" />
              <stop offset="100%" stopColor="#00F5E0" />
            </linearGradient>
            <linearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F2E9DB" />
              <stop offset="100%" stopColor="#FFD89C" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.2"/>
            </filter>
          </defs>
          
          {/* Animated background circles */}
          <motion.circle 
            cx="250" cy="250" r="200" 
            fill="url(#warmGrad)" 
            opacity="0.15"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle 
            cx="250" cy="250" r="160" 
            fill="url(#aquaGrad)" 
            opacity="0.1"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Main building complex */}
          <g filter="url(#shadow)">
            {/* Central tower */}
            <motion.rect 
              x="180" y="80" width="140" height="280" rx="12" 
              fill="url(#buildingGrad)"
              animate={{ y: [80, 75, 80] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Left building */}
            <motion.rect 
              x="100" y="180" width="70" height="180" rx="8" 
              fill="#0B1220"
              opacity="0.8"
              animate={{ y: [180, 185, 180] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Right building */}
            <motion.rect 
              x="330" y="150" width="90" height="210" rx="10" 
              fill="#0B1220"
              opacity="0.85"
              animate={{ y: [150, 155, 150] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Animated windows - Central building */}
            {[...Array(8)].map((_, row) => 
              [...Array(3)].map((_, col) => (
                <motion.rect
                  key={`win-${row}-${col}`}
                  x={195 + col * 40}
                  y={100 + row * 30}
                  width="25"
                  height="20"
                  rx="3"
                  fill="url(#aquaGrad)"
                  initial={{ opacity: 0.3 }}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                  }}
                  transition={{ 
                    duration: 3,
                    delay: (row + col) * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))
            )}
            
            {/* Left building windows */}
            {[...Array(5)].map((_, row) => (
              <motion.rect
                key={`left-${row}`}
                x="115"
                y={200 + row * 30}
                width="40"
                height="20"
                rx="3"
                fill="#00D1C1"
                animate={{ 
                  opacity: [0.4, 0.9, 0.4]
                }}
                transition={{ 
                  duration: 2.5,
                  delay: row * 0.3,
                  repeat: Infinity
                }}
              />
            ))}
            
            {/* Right building windows */}
            {[...Array(6)].map((_, row) => (
              <motion.rect
                key={`right-${row}`}
                x="350"
                y={170 + row * 30}
                width="50"
                height="20"
                rx="3"
                fill="#00D1C1"
                animate={{ 
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  delay: row * 0.25,
                  repeat: Infinity
                }}
              />
            ))}
          </g>
          
          {/* Floating data nodes */}
          <motion.g
            animate={{ 
              y: [-10, 10, -10],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="80" cy="120" r="30" fill="url(#aquaGrad)" filter="url(#glow)" opacity="0.9"/>
            <path d="M70 120 L78 128 L90 112" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.g>
          
          <motion.g
            animate={{ 
              y: [10, -10, 10],
              rotate: [0, -5, 0, 5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="420" cy="180" r="35" fill="url(#aquaGrad)" filter="url(#glow)" opacity="0.9"/>
            <rect x="405" y="168" width="30" height="4" rx="2" fill="white"/>
            <rect x="405" y="176" width="30" height="4" rx="2" fill="white"/>
            <rect x="405" y="184" width="20" height="4" rx="2" fill="white"/>
          </motion.g>
          
          <motion.g
            animate={{ 
              y: [-5, 5, -5],
              x: [-5, 5, -5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="100" cy="320" r="28" fill="url(#warmGrad)" filter="url(#glow)" opacity="0.95"/>
            <circle cx="100" cy="320" r="12" fill="url(#aquaGrad)"/>
            <circle cx="100" cy="320" r="6" fill="white"/>
          </motion.g>
          
          {/* Connection lines with animation */}
          <motion.path
            d="M 100 320 Q 150 250 220 250"
            stroke="url(#aquaGrad)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            opacity="0.6"
          />
          
          <motion.path
            d="M 80 120 Q 150 100 200 120"
            stroke="url(#aquaGrad)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            opacity="0.6"
          />
          
          <motion.path
            d="M 420 180 Q 350 200 300 180"
            stroke="url(#aquaGrad)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            opacity="0.6"
          />
          
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              cx={100 + (i % 5) * 80}
              cy={50 + Math.floor(i / 5) * 150}
              r="2"
              fill="#00D1C1"
              animate={{ 
                y: [-20, 20, -20],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1]
              }}
              transition={{ 
                duration: 3 + (i % 3),
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
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
          <defs>
            <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D1C1" />
              <stop offset="50%" stopColor="#00F5E0" />
              <stop offset="100%" stopColor="#00D1C1" />
            </linearGradient>
            <radialGradient id="orbGrad">
              <stop offset="0%" stopColor="#00D1C1" stopOpacity="1"/>
              <stop offset="100%" stopColor="#00D1C1" stopOpacity="0.3"/>
            </radialGradient>
            <filter id="featureGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Orbital rings */}
          <motion.circle
            cx="200" cy="200" r="120"
            stroke="url(#orbGrad)"
            strokeWidth="2"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '200px 200px' }}
            opacity="0.4"
          />
          <motion.circle
            cx="200" cy="200" r="80"
            stroke="url(#orbGrad)"
            strokeWidth="2"
            fill="none"
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '200px 200px' }}
            opacity="0.3"
          />
          
          {/* Central hub with glow */}
          <motion.g filter="url(#featureGlow)">
            <motion.circle 
              cx="200" cy="200" r="45" 
              fill="url(#centerGrad)"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: '200px 200px' }}
            />
            <circle cx="200" cy="200" r="35" fill="#0B1220" opacity="0.3"/>
            <motion.circle 
              cx="200" cy="200" r="25" 
              fill="white"
              animate={{ 
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
          
          {/* Orbiting feature nodes */}
          {[
            { angle: 0, color: '#0B1220', icon: 'calendar', size: 35 },
            { angle: 72, color: '#F2E9DB', icon: 'message', size: 35 },
            { angle: 144, color: '#00D1C1', icon: 'payment', size: 35 },
            { angle: 216, color: '#0B1220', icon: 'automation', size: 35 },
            { angle: 288, color: '#F2E9DB', icon: 'analytics', size: 35 }
          ].map((node, i) => {
            const radius = 120;
            const x = 200 + radius * Math.cos((node.angle - 90) * Math.PI / 180);
            const y = 200 + radius * Math.sin((node.angle - 90) * Math.PI / 180);
            
            return (
              <motion.g
                key={i}
                animate={{ 
                  rotate: 360,
                }}
                transition={{ 
                  duration: 15 + i * 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformOrigin: '200px 200px' }}
              >
                <motion.g
                  animate={{ 
                    rotate: -360,
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 15 + i * 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }
                  }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  <circle cx={x} cy={y} r={node.size} fill={node.color} filter="url(#featureGlow)"/>
                  
                  {/* Calendar icon */}
                  {node.icon === 'calendar' && (
                    <>
                      <rect x={x-12} y={y-10} width="24" height="20" rx="2" fill="#00D1C1" opacity="0.9"/>
                      <rect x={x-10} y={y-6} width="4" height="2" rx="1" fill="white"/>
                      <rect x={x-3} y={y-6} width="4" height="2" rx="1" fill="white"/>
                      <rect x={x+4} y={y-6} width="4" height="2" rx="1" fill="white"/>
                    </>
                  )}
                  
                  {/* Message icon */}
                  {node.icon === 'message' && (
                    <>
                      <rect x={x-12} y={y-8} width="24" height="16" rx="3" fill="#0B1220"/>
                      <path d={`M${x-8} ${y-4} L${x} ${y} L${x+8} ${y-4}`} stroke="#00D1C1" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </>
                  )}
                  
                  {/* Payment icon */}
                  {node.icon === 'payment' && (
                    <>
                      <rect x={x-12} y={y-8} width="24" height="16" rx="2" fill="#0B1220"/>
                      <rect x={x-10} y={y-2} width="6" height="4" rx="1" fill="#F2E9DB"/>
                      <rect x={x+4} y={y-2} width="6" height="1" rx="0.5" fill="#F2E9DB"/>
                      <rect x={x+4} y={y+1} width="4" height="1" rx="0.5" fill="#F2E9DB"/>
                    </>
                  )}
                  
                  {/* Automation icon */}
                  {node.icon === 'automation' && (
                    <>
                      <circle cx={x} cy={y} r="10" fill="#00D1C1" opacity="0.8"/>
                      <path d={`M${x-4} ${y} L${x} ${y-4} L${x+4} ${y} L${x} ${y+4} Z`} fill="white"/>
                    </>
                  )}
                  
                  {/* Analytics icon */}
                  {node.icon === 'analytics' && (
                    <>
                      <rect x={x-10} y={y+4} width="4" height="8" rx="1" fill="#0B1220"/>
                      <rect x={x-3} y={y} width="4" height="12" rx="1" fill="#0B1220"/>
                      <rect x={x+4} y={y-4} width="4" height="16" rx="1" fill="#0B1220"/>
                    </>
                  )}
                </motion.g>
              </motion.g>
            );
          })}
          
          {/* Connecting beams */}
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const innerR = 45;
            const outerR = 85;
            const x1 = 200 + innerR * Math.cos((angle - 90) * Math.PI / 180);
            const y1 = 200 + innerR * Math.sin((angle - 90) * Math.PI / 180);
            const x2 = 200 + outerR * Math.cos((angle - 90) * Math.PI / 180);
            const y2 = 200 + outerR * Math.sin((angle - 90) * Math.PI / 180);
            
            return (
              <motion.line
                key={`beam-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="url(#centerGrad)"
                strokeWidth="2"
                animate={{ 
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
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
        <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D1C1" />
              <stop offset="100%" stopColor="#00F5E0" />
            </linearGradient>
            <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F2E9DB" />
              <stop offset="100%" stopColor="#FFD89C" />
            </linearGradient>
            <filter id="workflowGlow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated flow paths */}
          <motion.path
            d="M70 100 C 150 100, 150 160, 200 160"
            stroke="url(#flowGrad1)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="12 6"
            animate={{ strokeDashoffset: [0, -72] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            opacity="0.6"
          />
          
          <motion.path
            d="M200 160 C 250 160, 250 100, 330 100"
            stroke="url(#flowGrad1)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="12 6"
            animate={{ strokeDashoffset: [0, -72] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            opacity="0.6"
          />
          
          {/* Flow particles */}
          {[
            { path: "M70 100 C 150 100, 150 160, 200 160", delay: 0 },
            { path: "M70 100 C 150 100, 150 160, 200 160", delay: 0.5 },
            { path: "M70 100 C 150 100, 150 160, 200 160", delay: 1 },
            { path: "M200 160 C 250 160, 250 100, 330 100", delay: 0 },
            { path: "M200 160 C 250 160, 250 100, 330 100", delay: 0.5 },
            { path: "M200 160 C 250 160, 250 100, 330 100", delay: 1 }
          ].map((particle, i) => (
            <motion.circle
              key={`flow-${i}`}
              r="4"
              fill="#00D1C1"
              filter="url(#workflowGlow)"
              animate={{
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3,
                delay: particle.delay,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ offsetPath: `path("${particle.path}")` }}
            />
          ))}
          
          {/* Step 1 Node */}
          <motion.g
            whileHover={{ scale: 1.1 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="70" cy="100" r="40" fill="url(#flowGrad1)" filter="url(#workflowGlow)"/>
            <circle cx="70" cy="100" r="32" fill="#0B1220" opacity="0.9"/>
            <text x="70" y="112" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">1</text>
            <motion.circle
              cx="70" cy="100" r="42"
              stroke="#00D1C1"
              strokeWidth="2"
              fill="none"
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: '70px 100px' }}
            />
          </motion.g>
          
          {/* Step 2 Node */}
          <motion.g
            whileHover={{ scale: 1.1 }}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="200" cy="160" r="45" fill="url(#flowGrad1)" filter="url(#workflowGlow)"/>
            <circle cx="200" cy="160" r="36" fill="#00D1C1" opacity="0.95"/>
            <text x="200" y="173" textAnchor="middle" fill="#0B1220" fontSize="36" fontWeight="bold">2</text>
            <motion.circle
              cx="200" cy="160" r="47"
              stroke="#00F5E0"
              strokeWidth="2"
              fill="none"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
              style={{ transformOrigin: '200px 160px' }}
            />
            
            {/* Rotating ring around step 2 */}
            <motion.circle
              cx="200" cy="160" r="55"
              stroke="#00D1C1"
              strokeWidth="2"
              strokeDasharray="8 4"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '200px 160px' }}
              opacity="0.4"
            />
          </motion.g>
          
          {/* Step 3 Node */}
          <motion.g
            whileHover={{ scale: 1.1 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle cx="330" cy="100" r="40" fill="url(#flowGrad2)" filter="url(#workflowGlow)"/>
            <circle cx="330" cy="100" r="32" fill="#0B1220" opacity="0.9"/>
            <text x="330" y="112" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">3</text>
            <motion.path
              d="M315 100 L325 110 L345 88"
              stroke="#00D1C1"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              animate={{ 
                pathLength: [0, 1],
                opacity: [0, 1]
              }}
              transition={{ 
                duration: 1,
                delay: 2,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          </motion.g>
          
          {/* Success burst from step 3 */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            return (
              <motion.line
                key={`burst-${i}`}
                x1="330"
                y1="100"
                x2={330 + 30 * Math.cos(angle)}
                y2={100 + 30 * Math.sin(angle)}
                stroke="#00D1C1"
                strokeWidth="2"
                strokeLinecap="round"
                animate={{
                  x2: [330, 330 + 50 * Math.cos(angle)],
                  y2: [100, 100 + 50 * Math.sin(angle)],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: 2.5 + i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            );
          })}
          
          {/* Decorative data points */}
          <motion.g
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="135" cy="130" r="6" fill="#F2E9DB"/>
            <circle cx="265" cy="130" r="6" fill="#F2E9DB"/>
          </motion.g>
          
          {/* Background grid effect */}
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={`bg-${i}`}
              cx={80 + i * 60}
              cy="240"
              r="3"
              fill="#00D1C1"
              animate={{ 
                y: [240, 230, 240],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity
              }}
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
            <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F5E0" />
              <stop offset="50%" stopColor="#00D1C1" />
              <stop offset="100%" stopColor="#009B8D" />
            </linearGradient>
            <linearGradient id="fireGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD89C" />
              <stop offset="100%" stopColor="#F2E9DB" />
            </linearGradient>
            <linearGradient id="fireGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F5E0" />
              <stop offset="100%" stopColor="#00D1C1" />
            </linearGradient>
            <radialGradient id="smokeGrad">
              <stop offset="0%" stopColor="#00D1C1" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#00D1C1" stopOpacity="0"/>
            </radialGradient>
            <filter id="ctaGlow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Stars field */}
          {[...Array(30)].map((_, i) => {
            const x = 50 + (i % 6) * 60;
            const y = 30 + Math.floor(i / 6) * 80;
            const size = 2 + (i % 3);
            return (
              <motion.g key={`star-${i}`}>
                <motion.circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="white"
                  animate={{ 
                    scale: [1, 1.8, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ 
                    duration: 2 + (i % 3),
                    delay: i * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {i % 3 === 0 && (
                  <>
                    <motion.line
                      x1={x} y1={y - size - 2}
                      x2={x} y2={y + size + 2}
                      stroke="white"
                      strokeWidth="0.5"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
                    />
                    <motion.line
                      x1={x - size - 2} y1={y}
                      x2={x + size + 2} y2={y}
                      stroke="white"
                      strokeWidth="0.5"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
                    />
                  </>
                )}
              </motion.g>
            );
          })}
          
          {/* Smoke trail */}
          {[...Array(6)].map((_, i) => (
            <motion.ellipse
              key={`smoke-${i}`}
              cx="200"
              cy={340 + i * 25}
              rx={20 + i * 5}
              ry={15 + i * 3}
              fill="url(#smokeGrad)"
              animate={{
                cy: [340 + i * 25, 380 + i * 25],
                opacity: [0.6, 0],
                scale: [1, 1.5]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              style={{ transformOrigin: '200px ' + (340 + i * 25) + 'px' }}
            />
          ))}
          
          {/* Main rocket with animation */}
          <motion.g
            animate={{ 
              y: [-15, 15, -15],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: '200px 200px' }}
          >
            {/* Rocket body */}
            <g filter="url(#ctaGlow)">
              <path
                d="M200 80 L230 240 L200 260 L170 240 Z"
                fill="url(#rocketGrad)"
              />
              <ellipse cx="200" cy="160" rx="25" ry="35" fill="#0B1220" opacity="0.3"/>
              
              {/* Window */}
              <circle cx="200" cy="160" r="28" fill="#0B1220"/>
              <circle cx="200" cy="160" r="22" fill="#00D1C1" opacity="0.8"/>
              <motion.circle 
                cx="200" cy="160" r="16" 
                fill="white"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Details */}
              <rect x="195" y="190" width="10" height="40" rx="2" fill="#0B1220" opacity="0.4"/>
            </g>
            
            {/* Wings with gradient */}
            <path d="M170 240 L140 300 L170 280 Z" fill="url(#rocketGrad)" opacity="0.9"/>
            <path d="M230 240 L260 300 L230 280 Z" fill="url(#rocketGrad)" opacity="0.9"/>
            <path d="M140 300 L130 310 L170 280 Z" fill="#0B1220" opacity="0.5"/>
            <path d="M260 300 L270 310 L230 280 Z" fill="#0B1220" opacity="0.5"/>
            
            {/* Flames with multiple layers */}
            <motion.g>
              {/* Outer flame */}
              <motion.path
                d="M180 260 L170 310 L185 290 Z"
                fill="url(#fireGrad1)"
                animate={{ 
                  d: [
                    "M180 260 L170 310 L185 290 Z",
                    "M180 260 L165 320 L185 295 Z",
                    "M180 260 L170 310 L185 290 Z"
                  ],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
              
              {/* Middle flame */}
              <motion.path
                d="M200 260 L190 330 L205 300 Z"
                fill="url(#fireGrad2)"
                animate={{ 
                  d: [
                    "M200 260 L190 330 L205 300 Z",
                    "M200 260 L185 345 L205 310 Z",
                    "M200 260 L190 330 L205 300 Z"
                  ],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ duration: 0.25, repeat: Infinity }}
              />
              
              {/* Right flame */}
              <motion.path
                d="M220 260 L215 310 L230 290 Z"
                fill="url(#fireGrad1)"
                animate={{ 
                  d: [
                    "M220 260 L215 310 L230 290 Z",
                    "M220 260 L210 320 L230 295 Z",
                    "M220 260 L215 310 L230 290 Z"
                  ],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 0.35, repeat: Infinity }}
              />
              
              {/* Inner bright flame */}
              <motion.path
                d="M195 260 L192 285 L198 275 Z"
                fill="white"
                animate={{ 
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.2, repeat: Infinity }}
                style={{ transformOrigin: '195px 270px' }}
              />
              <motion.path
                d="M205 260 L202 285 L208 275 Z"
                fill="white"
                animate={{ 
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.18, repeat: Infinity }}
                style={{ transformOrigin: '205px 270px' }}
              />
            </motion.g>
          </motion.g>
          
          {/* Speed lines */}
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={`speed-${i}`}
              x1={100 + i * 20}
              y1={150 + i * 15}
              x2={120 + i * 20}
              y2={150 + i * 15}
              stroke="#00D1C1"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                x1: [100 + i * 20, 60 + i * 20],
                x2: [120 + i * 20, 100 + i * 20],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
          
          {/* Orbiting success indicators */}
          {[0, 120, 240].map((angle, i) => {
            const radius = 100;
            const x = 200 + radius * Math.cos((angle - 90) * Math.PI / 180);
            const y = 200 + radius * Math.sin((angle - 90) * Math.PI / 180);
            
            return (
              <motion.g
                key={`orbit-${i}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: '200px 200px' }}
              >
                <motion.g
                  animate={{ 
                    rotate: -360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, delay: i * 0.5, repeat: Infinity }
                  }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  <circle cx={x} cy={y} r="18" fill="#00D1C1" filter="url(#ctaGlow)" opacity="0.9"/>
                  <path 
                    d={`M${x-6} ${y} L${x-2} ${y+5} L${x+7} ${y-6}`}
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </motion.g>
              </motion.g>
            );
          })}
        </svg>
      </motion.div>
    );
  }

  return null;
}