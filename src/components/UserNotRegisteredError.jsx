import React from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 mx-auto">
            <ShieldAlert className="w-8 h-8 text-orange-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">אין לך גישה למערכת</h1>
            <p className="text-gray-500 leading-relaxed">
              המשתמש שלך אינו רשום לאפליקציה זו.
              <br />
              צור קשר עם מנהל המערכת כדי לקבל גישה.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 text-right space-y-2">
            <p className="font-medium text-gray-700">מה ניתן לעשות?</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] flex-shrink-0" />
                ודא שנכנסת עם החשבון הנכון
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] flex-shrink-0" />
                פנה למנהל המערכת לקבלת הרשאה
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C1] flex-shrink-0" />
                נסה להתנתק ולהתחבר מחדש
              </li>
            </ul>
          </div>

          <button
            onClick={() => base44.auth.logout().then(() => { window.location.href = '/'; })}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            התנתק ונסה שוב
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
