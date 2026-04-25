export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        appMetadata: Record<string, unknown>;
        userMetadata: Record<string, unknown>;
      };
    }
  }
}
