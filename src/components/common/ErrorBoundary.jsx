import React from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F6FB] to-[#F2E9DB]/30 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-[#0B1220] mb-3">
              משהו השתבש
            </h1>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              אירעה שגיאה בלתי צפויה. אנחנו כבר עובדים על זה.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-right">
                <p className="text-xs text-red-800 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220]"
              >
                <RefreshCcw className="ml-2 h-4 w-4" />
                רענן דף
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl('Dashboard')}
                variant="outline"
                className="flex-1"
              >
                <Home className="ml-2 h-4 w-4" />
                חזרה לבית
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;