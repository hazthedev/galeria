interface GrecaptchaRenderParameters {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface Grecaptcha {
  render(container: string | HTMLElement, parameters: GrecaptchaRenderParameters): number;
  execute(siteKeyOrAction: string, options?: { action?: string }): Promise<string>;
  reset?(widgetId?: number): void;
  ready?(callback: () => void): void;
}

interface Window {
  grecaptcha?: Grecaptcha;
}
