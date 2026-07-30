interface Window {
  turnstile?: {
    render: (container: string | HTMLElement, params: any) => string;
    reset: (widgetId?: string) => void;
    getResponse: (widgetId?: string) => string | undefined;
  };
}
