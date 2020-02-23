export interface AuthStore {
  token: string;
  user: {
    id: string;
    name: string;
    community: {
      id: string;
      address: string;
      name: string;
    };
  };
}
