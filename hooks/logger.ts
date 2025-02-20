"use client";

interface LogData {
  message: string;
  data?: any;
  type?: 'info' | 'error';
}

class Logger {
  private async writeToFile(logData: LogData) {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async log(message: string, data?: any) {
    // Log to console
    console.log(message, data || '');
    
    // Log to file
    await this.writeToFile({ message, data, type: 'info' });
  }

  async error(message: string, data?: any) {
    // Log to console
    console.error(message, data || '');
    
    // Log to file
    await this.writeToFile({ message, data, type: 'error' });
  }
}

// Create a singleton instance
const logger = new Logger();

// Export the instance instead of the class
export { logger }; 