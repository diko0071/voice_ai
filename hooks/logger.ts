"use client";

interface LogData {
  message: string;
  data?: any;
  type?: 'info' | 'error';
}

class Logger {
  private async writeToFile(logData: LogData) {
    try {
      // Проверяем, что сообщение существует
      if (!logData.message) {
        console.error('Logger: Message is required');
        return;
      }
      
      // Безопасно сериализуем данные, избегая циклических ссылок
      let safeData = logData.data;
      if (safeData) {
        try {
          // Проверка на циклические ссылки
          JSON.stringify(safeData);
        } catch (jsonError) {
          // Если есть циклические ссылки, преобразуем в строку
          safeData = String(safeData);
          console.warn('Logger: Circular reference detected in data, converting to string');
        }
      }
      
      const safeLogData = {
        message: logData.message,
        data: safeData,
        type: logData.type || 'info'
      };
      
      await fetch('/api/internal/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeLogData),
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