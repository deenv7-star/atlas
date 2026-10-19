import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen flex items-center justify-center p-4" 
             style={{ 
               background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
               fontFamily: "'Heebo', system-ui, sans-serif"
             }}>
          <div className="max-w-md w-full">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                   style={{
                     background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)',
                     border: '2px solid rgba(239,68,68,0.2)'
                   }}>
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
              <h1 className="text-2xl font-bold text-[#1B2656] mb-3">
                אופס! משהו השתבש
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                אירעה שגיאה בלתי צפויה במערכת. אנחנו עובדים על זה.
              </p>

              {/* Error Details (Dev Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl text-right border border-red-100">
                  <p className="text-xs font-mono text-red-800 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 text-xs text-red-700">
                      <summary className="cursor-pointer font-semibold">פרטים טכניים</summary>
                      <pre className="mt-2 text-[10px] overflow-auto max-h-32 text-left">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={this.handleReload}
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold gap-2"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  טען מחדש את הדף
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full border-[#1B2656] text-[#1B2656] gap-2"
                  size="lg"
                >
                  <Home className="w-4 h-4" />
                  חזור לדף הבית
                </Button>
              </div>

              {/* Contact Support */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  אם הבעיה נמשכת,{' '}
                  <a 
                    href="/contact" 
                    className="text-brand-600 hover:text-brand-500 font-medium underline"
                  >
                    פנייה לתמיכה
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-6">
              © 2026 atlas • אנחנו כאן בשבילך
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;