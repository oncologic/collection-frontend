"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const SignInRedirectContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const redirectUrl = searchParams.get("redirect_url");

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && redirectUrl) {
        // User is signed in and we have a redirect URL
        const decodedUrl = decodeURIComponent(redirectUrl);
        router.push(decodedUrl);
      } else {
        // Fallback to dashboard
        router.push("/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, redirectUrl, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default function SignInRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInRedirectContent />
    </Suspense>
  );
}
