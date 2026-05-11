"use client";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut({
          sessionId: "all", // Sign out from all active sessions
          callbackUrl: "/dashboard", // Redirect URL after sign out
        });
        // Force a hard redirect to clear all client-side state
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
