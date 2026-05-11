import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown dashboard error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[Sentinel] React render failure", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-fallback">
          <div className="fatal-fallback__card panel">
            <p className="section-kicker">Application Recovery</p>
            <h1>Sentinel dashboard recovered from a render failure.</h1>
            <p>
              The UI hit an unexpected error, but this fallback keeps the app from going blank so
              the demo can continue.
            </p>
            <p className="fatal-fallback__message">{this.state.errorMessage}</p>
            <button className="primary-button" type="button" onClick={this.handleReload}>
              Reload dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
