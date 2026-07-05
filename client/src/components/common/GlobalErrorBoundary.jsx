import React from 'react';
import ErrorPage from '../../pages/ErrorPage';

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("💥 GlobalErrorBoundary caught a rendering exception:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          status={500}
          message="Ứng dụng đang gặp lỗi hiển thị bất ngờ. Vui lòng bấm thử lại để làm mới giao diện."
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
