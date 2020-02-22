export interface AuthStore {
  token: string;
  user: {
    id: string;
    name?: string;
  };
}
