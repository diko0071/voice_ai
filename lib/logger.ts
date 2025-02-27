// Server-side logger implementation

interface LogData {
  message: string;
  data?: any;
  type?: 'info' | 'error';
}

class Logger {
  log(message: string, data?: any) {
    // Log to console
    console.log(message, data || '');
  }

  error(message: string, data?: any) {
    // Log to console
    console.error(message, data || '');
  }
}

// Create a singleton instance
const logger = new Logger();

// Export the instance instead of the class
export { logger }; 