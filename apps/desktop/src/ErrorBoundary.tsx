import React from "react";

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * 全局错误边界：捕获 React 渲染期抛出的异常，
 * 把「空白页」变成「可读的错误信息」，便于定位根因。
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            color: "#f87171",
            background: "#000",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            minHeight: "100vh",
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            渲染出错（请把下面内容发给我定位）
          </h2>
          <div style={{ fontSize: 13, marginBottom: 12 }}>{this.state.error.message}</div>
          <pre
            style={{
              fontSize: 12,
              color: "#999",
              maxHeight: "70vh",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
