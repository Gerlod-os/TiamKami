import { Component } from 'react';

/**
 * Error Boundary для обработки ошибок в React-компонентах.
 * Показывает fallback UI вместо «бесконечной загрузки».
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
          <h2 className="text-lg font-heading text-red-400 mb-2">Произошла ошибка</h2>
          <p className="text-white/70 text-sm mb-3">
            Что-то пошло не так при загрузке данных.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-pink text-black rounded-xl hover:bg-white transition-colors"
          >
            Обновить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
