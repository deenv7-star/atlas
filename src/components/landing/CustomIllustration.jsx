import React from 'react';
import { motion } from 'framer-motion';

export default function CustomIllustration({ type }) {
  if (type === 'solution') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg mx-auto h-[500px]"
      >
        <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Simple abstract shapes */}
          <motion.circle
            cx="250" cy="200" r="120"
            fill="#00D1C1"
            opacity="0.08"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.circle
            cx="200" cy="280" r="80"
            fill="#0B1220"
            opacity="0.05"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.circle
            cx="320" cy="250" r="60"
            fill="#F2E9DB"
            opacity="0.4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Clean dashboard representation */}
          <rect x="150" y="180" width="200" height="140" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
          
          {/* Header */}
          <rect x="150" y="180" width="200" height="40" rx="12" fill="#0B1220"/>
          
          {/* Content bars */}
          <motion.rect 
            x="170" y="240" width="160" height="8" rx="4" 
            fill="#00D1C1"
            animate={{ width: [120, 160, 120] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <rect x="170" y="260" width="100" height="8" rx="4" fill="#E2E8F0"/>
          <motion.rect 
            x="170" y="280" width="140" height="8" rx="4" 
            fill="#F2E9DB"
            animate={{ width: [100, 140, 100] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
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
          {/* Phone mockup */}
          <motion.g
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <rect x="150" y="80" width="180" height="320" rx="20" fill="#0B1220"/>
            <rect x="160" y="95" width="160" height="290" rx="12" fill="white"/>
            
            {/* Status bar */}
            <rect x="160" y="95" width="160" height="30" fill="#F8FAFC"/>
            <text x="175" y="115" fill="#0B1220" fontSize="10" fontWeight="600">9:41</text>
            
            {/* App content */}
            <rect x="170" y="135" width="140" height="50" rx="8" fill="#00D1C1" fillOpacity="0.1"/>
            <circle cx="188" cy="160" r="8" fill="#00D1C1"/>
            <rect x="205" y="150" width="90" height="6" rx="3" fill="#E2E8F0"/>
            <rect x="205" y="162" width="60" height="4" rx="2" fill="#E2E8F0"/>
            
            <rect x="170" y="195" width="140" height="50" rx="8" fill="#F2E9DB" fillOpacity="0.5"/>
            <circle cx="188" cy="220" r="8" fill="#0B1220" fillOpacity="0.2"/>
            <rect x="205" y="210" width="90" height="6" rx="3" fill="#E2E8F0"/>
            <rect x="205" y="222" width="70" height="4" rx="2" fill="#E2E8F0"/>
            
            <rect x="170" y="255" width="140" height="50" rx="8" fill="#00D1C1" fillOpacity="0.1"/>
            <circle cx="188" cy="280" r="8" fill="#00D1C1"/>
            <rect x="205" y="270" width="90" height="6" rx="3" fill="#E2E8F0"/>
            <rect x="205" y="282" width="50" height="4" rx="2" fill="#E2E8F0"/>
          </motion.g>
          
          {/* Desktop window */}
          <motion.g
            animate={{ y: [0, 5, 0], x: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <rect x="50" y="180" width="140" height="120" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
            <rect x="50" y="180" width="140" height="25" rx="8" fill="#F8FAFC"/>
            <circle cx="62" cy="192" r="3" fill="#FF6B6B"/>
            <circle cx="72" cy="192" r="3" fill="#FFD93D"/>
            <circle cx="82" cy="192" r="3" fill="#6BCF7F"/>
            
            <rect x="60" y="220" width="50" height="6" rx="3" fill="#E2E8F0"/>
            <rect x="60" y="235" width="70" height="6" rx="3" fill="#E2E8F0"/>
            <rect x="60" y="250" width="60" height="6" rx="3" fill="#E2E8F0"/>
            
            <rect x="135" y="220" width="45" height="45" rx="6" fill="#00D1C1" fillOpacity="0.1"/>
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
        className="relative w-full max-w-md h-80 mx-auto"
      >
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Flow line */}
          <motion.path
            d="M80 150 L180 150 L180 150 L280 150 L280 150 L380 150"
            stroke="#E2E8F0"
            strokeWidth="3"
            fill="none"
          />
          
          <motion.path
            d="M80 150 L180 150 L180 150 L280 150 L280 150 L380 150"
            stroke="#00D1C1"
            strokeWidth="3"
            fill="none"
            strokeDasharray="400"
            animate={{ strokeDashoffset: [400, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          
          {/* Step 1 */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="80" cy="150" r="35" fill="white" stroke="#E2E8F0" strokeWidth="3"/>
            <circle cx="80" cy="150" r="28" fill="#0B1220"/>
            <text x="80" y="160" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">1</text>
          </motion.g>
          
          {/* Step 2 */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
          >
            <circle cx="230" cy="150" r="35" fill="white" stroke="#E2E8F0" strokeWidth="3"/>
            <circle cx="230" cy="150" r="28" fill="#00D1C1"/>
            <text x="230" y="160" textAnchor="middle" fill="#0B1220" fontSize="24" fontWeight="bold">2</text>
          </motion.g>
          
          {/* Step 3 */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
          >
            <circle cx="380" cy="150" r="35" fill="white" stroke="#E2E8F0" strokeWidth="3"/>
            <circle cx="380" cy="150" r="28" fill="#F2E9DB"/>
            <text x="380" y="160" textAnchor="middle" fill="#0B1220" fontSize="24" fontWeight="bold">3</text>
          </motion.g>
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
          {/* Success metrics cards */}
          <motion.g
            animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ transformOrigin: '200px 200px' }}
          >
            <rect x="100" y="150" width="200" height="120" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
            <rect x="120" y="180" width="160" height="60" rx="12" fill="#00D1C1" fillOpacity="0.1"/>
            <text x="200" y="215" textAnchor="middle" fill="#00D1C1" fontSize="36" fontWeight="bold">+47%</text>
            <text x="200" y="235" textAnchor="middle" fill="#64748B" fontSize="14">גידול בהכנסות</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [0, 8, 0], rotate: [2, -2, 2] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ transformOrigin: '250px 320px' }}
          >
            <rect x="150" y="290" width="200" height="100" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
            <circle cx="200" cy="340" r="25" fill="#00D1C1" fillOpacity="0.2"/>
            <path d="M193 340 L198 345 L207 333" stroke="#00D1C1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <text x="235" y="335" fill="#0B1220" fontSize="14" fontWeight="600">12 שעות</text>
            <text x="235" y="352" fill="#64748B" fontSize="12">חיסכון שבועי</text>
          </motion.g>
          
          <motion.g
            animate={{ y: [0, -5, 0], x: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <rect x="50" y="90" width="140" height="80" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="2"/>
            <text x="120" y="120" textAnchor="middle" fill="#0B1220" fontSize="28" fontWeight="bold">98%</text>
            <text x="120" y="145" textAnchor="middle" fill="#64748B" fontSize="12">שביעות רצון</text>
            <rect x="80" y="155" width="80" height="4" rx="2" fill="#00D1C1"/>
          </motion.g>
          
          {/* Floating elements */}
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={100 + i * 60}
              cy={50 + (i % 2) * 400}
              r="4"
              fill="#00D1C1"
              opacity="0.3"
              animate={{ 
                y: [-10, 10, -10],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
        </svg>
      </motion.div>
    );
  }

  return null;
}