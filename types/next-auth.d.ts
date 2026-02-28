import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'vendor';
      phone?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'vendor';
    phone?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'user' | 'vendor';
    phone?: string;
  }
}
