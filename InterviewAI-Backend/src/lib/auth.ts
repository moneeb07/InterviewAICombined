import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
 
const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/database");
const db = client.db();

const baseURL = process.env.BASE_URL || "http://localhost:5000";
const clientURL = process.env.CLIENT_URL || "http://localhost:5173";

export const auth = betterAuth({
  baseURL: baseURL,
  database: mongodbAdapter(db),
  socialProviders: {
    google: { 
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    },
    github: {
        clientId : process.env.GITHUB_CLIENT_ID as string,
        clientSecret : process.env.GITHUB_CLIENT_SECRET as string,
    }
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true
    },
    defaultCookieAttributes: {
      secure: true,
      sameSite: "none",
      path: "/"
    }
  },
  trustedOrigins: [clientURL],
});