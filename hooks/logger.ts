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

export const logger = new Logger(); 