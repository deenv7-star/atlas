import React from 'react';
import { motion } from 'framer-motion';

export default function CustomIllustration({ type }) {
  if (type === 'solution') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative w-full max-w-md mx-auto"
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circles */}
          <motion.circle 
            cx="200" cy="200" r="150" 
            fill="#F2E9DB" 
            opacity="0.3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.circle 
            cx="200" cy="200" r="120" 
            fill="#00D1C1" 
            opacity="0.15"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Main building */}
          <rect x="140" y="120" width="120" height="180" rx="8" fill="#0B1220"/>
          <rect x="150" y="140" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.8"/>
          <rect x="190" y="140" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.6"/>
          <rect x="230" y="140" width="20" height="40" rx="4" fill="#00D1C1" opacity="0.4"/>
          
          <rect x="150" y="190" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.6"/>
          <rect x="190" y="190" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.8"/>
          <rect x="230" y="190" width="20" height="40" rx="4" fill="#00D1C1" opacity="0.4"/>
          
          <rect x="150" y="240" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.4"/>
          <rect x="190" y="240" width="30" height="40" rx="4" fill="#00D1C1" opacity="0.6"/>
          <rect x="230" y="240" width="20" height="40" rx="4" fill="#00D1C1" opacity="0.8"/>
          
          {/* Checkmarks floating around */}
          <motion.g
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="100" cy="160" r="20" fill="#00D1C1"/>
            <path d="M92 160 L98 166 L108 154" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </motion.g>
          
          <motion.g
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <circle cx="300" cy="200" r="20" fill="#00D1C1"/>
            <path d="M292 200 L298 206 L308 194" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </motion.g>
          
          <motion.g
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <circle cx="120" cy="260" r="16" fill="#F2E9DB"/>
            <path d="M114 260 L118 264 L126 254" stroke="#0B1220" strokeWidth="2.5" strokeLinecap="round"/>
          </motion.g>
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
        className="relative w-48 h-48 mx-auto"
      >
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Central hub */}
          <motion.circle 
            cx="100" cy="100" r="30" 
            fill="#00D1C1"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Orbiting elements */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <circle cx="100" cy="40" r="15" fill="#0B1220"/>
            <rect x="92" y="34" width="16" height="2" fill="#00D1C1"/>
            <rect x="92" y="40" width="16" height="2" fill="#00D1C1"/>
            <rect x="92" y="46" width="16" height="2" fill="#00D1C1"/>
          </motion.g>
          
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <circle cx="160" cy="100" r="15" fill="#F2E9DB"/>
            <path d="M154 100 L158 104 L166 94" stroke="#0B1220" strokeWidth="2" strokeLinecap="round"/>
          </motion.g>
          
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <circle cx="100" cy="160" r="15" fill="#0B1220"/>
            <circle cx="100" cy="160" r="6" fill="#00D1C1"/>
          </motion.g>
          
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <circle cx="40" cy="100" r="15" fill="#00D1C1" opacity="0.6"/>
            <rect x="35" y="95" width="10" height="10" rx="2" fill="white"/>
          </motion.g>
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
        className="relative w-64 h-64 mx-auto"
      >
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Flow diagram */}
          <motion.path
            d="M50 80 L150 80 L150 150 L250 150"
            stroke="#00D1C1"
            strokeWidth="4"
            strokeDasharray="8 4"
            animate={{ strokeDashoffset: [0, -48] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Node 1 */}
          <motion.g
            whileHover={{ scale: 1.1 }}
          >
            <circle cx="50" cy="80" r="25" fill="#0B1220"/>
            <text x="50" y="88" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">1</text>
          </motion.g>
          
          {/* Node 2 */}
          <motion.g
            whileHover={{ scale: 1.1 }}
          >
            <circle cx="150" cy="150" r="25" fill="#00D1C1"/>
            <text x="150" y="158" textAnchor="middle" fill="#0B1220" fontSize="24" fontWeight="bold">2</text>
          </motion.g>
          
          {/* Node 3 */}
          <motion.g
            whileHover={{ scale: 1.1 }}
          >
            <circle cx="250" cy="150" r="25" fill="#0B1220"/>
            <text x="250" y="158" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">3</text>
          </motion.g>
          
          {/* Decorative elements */}
          <motion.circle
            cx="150" cy="80" r="8"
            fill="#F2E9DB"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
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
        className="relative w-full max-w-md mx-auto"
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rocket/Success theme */}
          <motion.g
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {/* Rocket body */}
            <path
              d="M200 80 L220 180 L200 200 L180 180 Z"
              fill="#00D1C1"
            />
            <circle cx="200" cy="140" r="20" fill="#0B1220"/>
            <circle cx="200" cy="140" r="10" fill="white" opacity="0.8"/>
            
            {/* Wings */}
            <path d="M180 180 L160 220 L180 210 Z" fill="#0B1220"/>
            <path d="M220 180 L240 220 L220 210 Z" fill="#0B1220"/>
            
            {/* Fire */}
            <motion.path
              d="M190 200 L185 230 L195 220 Z"
              fill="#F2E9DB"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <motion.path
              d="M200 200 L195 235 L205 225 Z"
              fill="#00D1C1"
              opacity="0.8"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            <motion.path
              d="M210 200 L205 230 L215 220 Z"
              fill="#F2E9DB"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </motion.g>
          
          {/* Stars */}
          {[...Array(8)].map((_, i) => (
            <motion.circle
              key={i}
              cx={100 + (i % 4) * 70}
              cy={50 + Math.floor(i / 4) * 300}
              r="3"
              fill="white"
              opacity="0.6"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity 
              }}
            />
          ))}
        </svg>
      </motion.div>
    );
  }

  return null;
}