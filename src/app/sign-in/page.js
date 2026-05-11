"use client";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import contexliaLogo from "../../../public/images/Contexlia.png";

const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const redirectUrl = searchParams.get("redirect_url");
  const plan = searchParams.get("plan");
  const tenant = searchParams.get("tenant");
  const tenantName = searchParams.get("tenantName");
  const pricingType = searchParams.get("pricingType");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (redirectUrl) {
        const decodedUrl = decodeURIComponent(redirectUrl);
        router.push(decodedUrl);
      } else if (plan || tenant) {
        const params = new URLSearchParams();
        if (plan) params.set("plan", plan);
        if (tenant) params.set("tenant", tenant);
        if (tenantName) params.set("tenantName", tenantName);
        if (pricingType) params.set("pricingType", pricingType);
        router.push(`/dashboard?${params.toString()}`);
      } else {
        router.push("/dashboard");
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    redirectUrl,
    plan,
    tenant,
    tenantName,
    pricingType,
    router,
  ]);

  const getAfterSignInUrl = () => {
    if (redirectUrl) {
      return `/sign-in/redirect?redirect_url=${encodeURIComponent(
        redirectUrl
      )}`;
    } else if (plan || tenant) {
      const params = new URLSearchParams();
      if (plan) params.set("plan", plan);
      if (tenant) params.set("tenant", tenant);
      if (tenantName) params.set("tenantName", tenantName);
      if (pricingType) params.set("pricingType", pricingType);
      return `/dashboard?${params.toString()}`;
    }
    return "/dashboard";
  };

  const afterSignInUrl = getAfterSignInUrl();

  // Handle sign in
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!signInLoaded) {
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(afterSignInUrl);
      } else if (result.status === "needs_first_factor") {
        // Email verification needed
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: result.supportedFirstFactors.find(
            (factor) => factor.strategy === "email_code"
          )?.emailAddressId,
        });
        setPendingVerification(true);
      }
    } catch (err) {
      console.error("Error:", err);
      setErrors({
        submit:
          err.errors?.[0]?.message ||
          "Invalid email or password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle verification
  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!signInLoaded) {
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(afterSignInUrl);
      }
    } catch (err) {
      console.error("Error:", err);
      setErrors({
        verification: err.errors?.[0]?.message || "Invalid verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth sign in
  const handleOAuthSignIn = async (strategy) => {
    if (!signInLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: afterSignInUrl,
      });
    } catch (err) {
      console.error("OAuth error:", err);
      setErrors({
        oauth: "Failed to sign in with social provider. Please try again.",
      });
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ forgot: "Please enter your email address first." });
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setErrors({
        forgot: "Password reset email sent! Check your inbox.",
      });
    } catch (err) {
      console.error("Error:", err);
      setErrors({
        forgot: err.errors?.[0]?.message || "Failed to send reset email.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 py-8 px-4 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 items-center justify-center mb-4 shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-400">
                We sent a verification code to {email}
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg font-semibold tracking-widest text-white placeholder-gray-400"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>

              {errors.verification && (
                <p className="text-red-400 text-sm">{errors.verification}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-slate-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-slate-900 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="w-full py-3 px-4 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition-all"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto md:ml-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-8 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            <div className="flex justify-center mb-6">
              <div className="rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Image
                  src={contexliaLogo}
                  alt="Contexlia Logo"
                  width={100}
                  height={100}
                  className="rounded-lg"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">Sign in to your Contexlia account</p>

            {(redirectUrl || plan) && (
              <div className="mt-4 inline-block bg-gray-800 border border-gray-700 text-blue-400 text-sm px-4 py-2 rounded-full font-medium">
                {plan
                  ? "Complete your plan selection"
                  : "You'll be redirected after signing in"}
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleOAuthSignIn("oauth_google")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all font-medium text-gray-200"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuthSignIn("oauth_facebook")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all font-medium text-gray-200"
              >
                <FaFacebook className="w-5 h-5 text-blue-500" />
                Continue with Facebook
              </button>
            </div>

            {errors.oauth && (
              <p className="text-red-400 text-sm mb-4">{errors.oauth}</p>
            )}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">or</span>
              </div>
            </div>

            {/* Sign in form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              {errors.forgot && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm ${
                    errors.forgot.includes("sent")
                      ? "bg-green-900/20 border border-green-700 text-green-400"
                      : "bg-yellow-900/20 border border-yellow-700 text-yellow-400"
                  }`}
                >
                  {errors.forgot}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-slate-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-slate-900 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="flex items-center justify-center space-x-1 text-sm text-gray-400">
                <span>Don&apos;t have an account?</span>
                <Link
                  href="/sign-up"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Feature highlights (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-gray-800 to-gray-700 items-center justify-center p-12 border-l border-gray-700 overflow-y-auto">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">Welcome Back</h2>
          <p className="text-xl text-gray-300 mb-8">
            Continue your journey with Contexlia&apos;s comprehensive kidney
            cancer resources and community.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Track Your Progress
                </h3>
                <p className="text-gray-400">
                  Access your saved resources, collections, and personalized
                  content.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Share with Others
                </h3>
                <p className="text-gray-400">
                  Share resources with a supportive community of patients and
                  caregivers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Access</h3>
                <p className="text-gray-400">
                  Your account is protected with industry-standard security
                  measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
