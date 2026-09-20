interface Window {
  turnstile?: {
    render: (container: string | HTMLElement, params: any) => string;
    reset: (target?: string | HTMLElement) => void;
    getResponse: (widgetId?: string) => string | undefined;
  };
}
