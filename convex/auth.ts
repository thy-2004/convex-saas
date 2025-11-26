import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { ResendOTP } from "./otp/ResendOTP";


export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    ResendOTP,

    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: "user:email" },
      },
      
    }),
    
  ],
});
