"use client";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CustomSignUp({ afterSignUpUrl, plan }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Detect if this is personal tenant signup
  const isPersonalTenant =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("personal") ||
      window.location.pathname.includes("personal"));

  // Create user in database after Clerk signup
  const createUserInDatabase = async (clerkUser) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: clerkUser.emailAddresses[0].emailAddress,
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
          roles: [], // Or default roles
          tenants: [] // Will be set through tenant selection modal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user in database');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating user in database:', error);
      toast.error('Failed to complete signup. Please try again.');
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      // Create the signup with metadata
      await signUp.create({
        emailAddress: email,
        password: password,
        unsafeMetadata: {
          signup_tenant: isPersonalTenant ? "personal" : "kidney",
        },
      });

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set to show verification form
      setPendingVerification(true);
    } catch (err) {
      console.error("Error during sign up:", err);
      setError(err.errors?.[0]?.message || "Something went wrong");
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status !== "complete") {
        setError("Unable to complete signup. Please try again.");
        return;
      }

      if (completeSignUp.status === "complete") {
        // Set the active session first
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create user in database
        try {
          await createUserInDatabase(completeSignUp.createdUser);
          toast.success("Account created successfully!");
        } catch (dbError) {
          // If database creation fails, we should still let them proceed
          // since they're already signed up in Clerk
          console.error("Failed to create database user:", dbError);
        }
        
        // Redirect to dashboard
        router.push(afterSignUpUrl || "/dashboard");
      }
    } catch (err) {
      console.error("Error during verification:", err);
      setError(err.errors?.[0]?.message || "Verification failed");
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {!pendingVerification ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Sign Up
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerification} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verify your email
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            We sent a verification code to {email}
          </p>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter verification code"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Verify Email
          </button>
        </form>
      )}
    </div>
  );
}
