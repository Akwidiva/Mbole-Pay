import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      username?: string | null
      phone?: string | null
      role?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    username?: string | null
    phone?: string | null
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username?: string | null
    phone?: string | null
    role?: string | null
  }
}

