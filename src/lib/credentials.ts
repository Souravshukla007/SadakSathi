export interface AuthorityCredentials {
  username: string;
  password: string;
  role: 'municipal' | 'traffic';
  displayName: string;
}

export const AUTH_CREDENTIALS: Record<string, AuthorityCredentials> = {
  municipal: {
    username: 'municipal-admin',
    password: 'municipal123',
    role: 'municipal',
    displayName: 'Municipal Authority'
  },
  traffic: {
    username: 'traffic-officer',
    password: 'traffic123',
    role: 'traffic',
    displayName: 'Traffic Authority'
  }
};

export function validateCredentials(username: string, password: string): AuthorityCredentials | null {
  for (const key in AUTH_CREDENTIALS) {
    const creds = AUTH_CREDENTIALS[key];
    if (creds.username === username && creds.password === password) {
      return creds;
    }
  }
  return null;
}

export function getCredentialsByRole(role: string): AuthorityCredentials | null {
  return AUTH_CREDENTIALS[role] || null;
}