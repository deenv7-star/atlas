import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, TrendingUp, Users } from 'lucide-react';

export default function PhoneMockup({ variant = 'dark' }) {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* iPhone Frame */}
      <div className="relative mx-auto" style={{ width: '300px', height: '600px' }}>
        {/* Phone Outer Frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
          {/* Screen */}
          <div className="relative h-full bg-white rounded-[2.5rem] overflow-hidden">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/10 to-transparent z-10">
              <div className="flex items-center justify-between px-6 pt-2">
                <span className="text-xs font-semibold">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-3 border border-gray-400 rounded-sm">
                    <div className="w-2 h-2 bg-gray-900 rounded-sm ml-0.5 mt-0.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Island */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-7 bg-black rounded-full z-20" />

            {/* App Content */}
            <div className="pt-12 px-4 pb-4 h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">לוח הבקרה</h2>
                <p className="text-xs text-gray-500">ברוך שובך, דני</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <motion.div 
                  className="bg-gradient-to-br from-[#00D1C1]/20 to-cyan-100 rounded-xl p-3"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-[#00D1C1]" />
                    <span className="text-xs text-gray-600">הזמנות</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">24</p>
                  <p className="text-xs text-green-600">+12% החודש</p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">הכנסות</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">₪84K</p>
                  <p className="text-xs text-green-600">+8% החודש</p>
                </motion.div>
              </div>

              {/* Booking List */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">הזמנות קרובות</span>
                  <span className="text-xs text-[#00D1C1]">5 פעילות</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'משפחת כהן', property: 'וילה כנרת', status: 'מאושר', color: 'green' },
                    { name: 'דני לוי', property: 'סוויטה ת"א', status: 'ממתין', color: 'yellow' },
                  ].map((booking, i) => (
                    <motion.div 
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{booking.name}</p>
                          <p className="text-xs text-gray-500">{booking.property}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.color === 'green' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Users, label: 'לידים', color: 'from-blue-400 to-cyan-500' },
                  { icon: Calendar, label: 'הזמנות', color: 'from-purple-400 to-pink-500' },
                  { icon: TrendingUp, label: 'דוחות', color: 'from-green-400 to-emerald-500' },
                ].map((action, i) => (
                  <motion.div
                    key={i}
                    className={`bg-gradient-to-br ${action.color} rounded-xl p-2 flex flex-col items-center justify-center`}
                    whileHover={{ scale: 1.05 }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ 
                      y: { duration: 2, repeat: Infinity, delay: i * 0.3 },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <action.icon className="w-5 h-5 text-white mb-1" />
                    <span className="text-xs text-white font-medium">{action.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
        </div>

        {/* Notification Badge */}
        <motion.div 
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg z-30"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          3
        </motion.div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D1C1]/20 to-blue-500/20 rounded-[3rem] blur-3xl -z-10" />
      </div>
    </motion.div>
  );
}