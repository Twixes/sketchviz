import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If login was successful, redirect to a page that closes the popup
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/auth/callback`;
      }
      return baseUrl;
    },
    authorized() {
      // Allow all requests to pass through - we'll handle auth in the UI
      return true;
    },
  },
});
