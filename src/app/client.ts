import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set in environment variables. Please add it to .env.local or Vercel environment variables."
  );
}

export const client = createThirdwebClient({
  clientId: clientId as string,
});
