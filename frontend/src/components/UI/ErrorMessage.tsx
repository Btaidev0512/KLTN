import React from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.', 
  onRetry,
  fullScreen = false,
  type = 'error'
}) => {
  const icon = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  const containerClass = fullScreen ? 'error-fullscreen' : 'error-container';

  return (
    <div className={containerClass}>
      <div className={`error-content error-content--${type}`}>
        <div className="error-icon">{icon}</div>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            <i className="fas fa-redo"></i> Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
