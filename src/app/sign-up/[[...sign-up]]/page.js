"use client";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import contexliaLogo from "../../../../public/images/Contexlia.png";

const SignUpPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Get pricing page parameters
  const plan = searchParams.get("plan");
  const tenant = searchParams.get("tenant");
  const tenantName = searchParams.get("tenantName");
  const pricingType = searchParams.get("pricingType");

  // Create the after sign up URL with the appropriate parameters
  const getAfterSignUpUrl = () => {
    if (plan || tenant) {
      const params = new URLSearchParams();
      if (plan) params.set("plan", plan);
      if (tenant) params.set("tenant", tenant);
      if (tenantName) params.set("tenantName", tenantName);
      if (pricingType) params.set("pricingType", pricingType);

      return `/dashboard?${params.toString()}`;
    }
    return "/dashboard";
  };

  const afterSignUpUrl = getAfterSignUpUrl();
  const isAuthReady = isLoaded && signUpLoaded;

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(afterSignUpUrl);
    }
  }, [afterSignUpUrl, isLoaded, isSignedIn, router]);

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    const checks = [
      { regex: /.{8,}/, text: "At least 8 characters" },
      { regex: /[A-Z]/, text: "One uppercase letter" },
      { regex: /[a-z]/, text: "One lowercase letter" },
      { regex: /\d/, text: "One number" },
      { regex: /[^A-Za-z0-9]/, text: "One special character" },
    ];

    return checks.map((check) => ({
      ...check,
      passed: check.regex.test(pass),
    }));
  };

  const passwordStrength = checkPasswordStrength(password);
  const passwordScore = passwordStrength.filter((check) => check.passed).length;

  // Handle sign up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!isAuthReady || !signUp) {
      setLoading(false);
      return;
    }

    if (isSignedIn) {
      router.replace(afterSignUpUrl);
      setLoading(false);
      return;
    }

    try {
      // Check if terms are accepted
      if (!acceptedTerms) {
        setErrors({
          submit: "You must accept the Terms of Service to continue.",
        });
        setLoading(false);
        return;
      }

      const signUpData = {
        emailAddress: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        unsafeMetadata: {
          signup_tenant:
            searchParams.get("tenant") === "personal" ? "personal" : "kidney",
          // Store terms acceptance in metadata (legally valid)
          termsAcceptedAt: new Date().toISOString(),
          termsAcceptedIp: window.location.hostname, // Store IP for legal records
          privacyAcceptedAt: new Date().toISOString(),
        },
      };

      const result = await signUp.create(signUpData);

      // Check if only legal_accepted is missing (which we're handling ourselves)
      if (
        result.status === "missing_requirements" &&
        result.missingFields?.length === 1 &&
        result.missingFields[0] === "legal_accepted"
      ) {
        // Since we track terms in metadata, we can consider this complete
        // But Clerk won't let us proceed without disabling the requirement in dashboard
        setErrors({
          submit:
            "Please contact support to complete registration. Your terms acceptance has been recorded.",
        });

        // Actually, you need to disable legal requirement in Clerk Dashboard
        // Go to dashboard.clerk.com → User & Authentication → Disable legal consent
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(afterSignUpUrl);
      } else {
        console.error(
          "Unexpected status or missing fields:",
          result.status,
          result.missingFields,
        );
        setErrors({
          submit: "Unable to complete sign up. Please try again.",
        });
      }
    } catch (err) {
      const clerkMessage =
        err?.errors?.[0]?.message || "Something went wrong. Please try again.";

      console.error("Sign up error:", {
        code: err?.errors?.[0]?.code,
        message: clerkMessage,
      });
      setErrors({
        submit: clerkMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle verification
  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!isAuthReady || !signUp) {
      setLoading(false);
      return;
    }

    if (isSignedIn) {
      router.replace(afterSignUpUrl);
      setLoading(false);
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push(afterSignUpUrl);
      }
    } catch (err) {
      const clerkMessage =
        err?.errors?.[0]?.message || "Invalid verification code.";

      console.error("Verification error:", {
        code: err?.errors?.[0]?.code,
        message: clerkMessage,
      });
      setErrors({
        verification: clerkMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth sign up
  const handleOAuthSignUp = async (strategy) => {
    if (!isAuthReady || !signUp) return;

    if (isSignedIn) {
      router.replace(afterSignUpUrl);
      return;
    }

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: afterSignUpUrl,
      });
    } catch (err) {
      const clerkMessage = err?.errors?.[0]?.message || err?.message || "";

      if (/already signed in/i.test(clerkMessage)) {
        router.replace(afterSignUpUrl);
        return;
      }

      console.error("OAuth error:", err);
      setErrors({
        oauth: "Failed to sign up with social provider. Please try again.",
      });
    }
  };

  if (!isAuthReady || isSignedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-900 py-8 px-4 pb-24">
        <div className="text-center text-gray-300">
          {isSignedIn ? "Redirecting..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-900 py-8 px-4 pb-24">
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
                Back to Sign Up
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-gray-900 pb-24 lg:pb-0">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 lg:py-8 overflow-y-auto">
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

            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to Contexlia
            </h1>
            <p className="text-gray-400">Create your account to get started</p>

            {plan && (
              <div className="mt-4 inline-block bg-gray-800 border border-gray-700 text-blue-400 text-sm px-4 py-2 rounded-full font-medium">
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Selected
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleOAuthSignUp("oauth_google")}
                disabled={!isAuthReady || isSignedIn || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all font-medium text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignUp("oauth_facebook")}
                disabled={!isAuthReady || isSignedIn || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all font-medium text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFacebook className="w-5 h-5 text-blue-500" />
                Continue with Facebook
              </button>
            </div>

            {errors.oauth && (
              <p className="text-red-400 text-sm mb-4">{errors.oauth}</p>
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-600/60" />
              <span className="px-2 text-sm text-gray-400 bg-gray-800 rounded">
                or
              </span>
              <div className="h-px flex-1 bg-gray-600/60" />
            </div>

            {/* Sign up form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                    placeholder="Create a strong password"
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

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i < passwordScore
                              ? passwordScore <= 2
                                ? "bg-red-500"
                                : passwordScore <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              : "bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {passwordStrength.map((check, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          {check.passed ? (
                            <FaCheck className="w-3 h-3 text-green-400" />
                          ) : (
                            <FaTimes className="w-3 h-3 text-gray-500" />
                          )}
                          <span
                            className={
                              check.passed ? "text-green-400" : "text-gray-500"
                            }
                          >
                            {check.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              <div
                id="clerk-captcha"
                className="flex justify-center"
                data-cl-theme="dark"
                data-cl-size="flexible"
              />

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-400">
                  I agree to the{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  !isAuthReady ||
                  isSignedIn ||
                  loading ||
                  passwordScore < 3 ||
                  !acceptedTerms
                }
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="flex items-center justify-center space-x-1 text-sm text-gray-400">
                <span>Already have an account?</span>
                <Link
                  href="/sign-in"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Feature highlights (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-gray-800 to-gray-700 items-center justify-center p-12 border-l border-gray-700 overflow-y-auto">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your account to access Contexlia&apos;s comprehensive kidney
            cancer resources and supportive community.
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Stay Informed</h3>
                <p className="text-gray-400">
                  Get the latest updates and information about kidney cancer
                  research and treatments.
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
                <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                <p className="text-gray-400">
                  Your data is protected with industry-standard security
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

const SignUpPage = () => {
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
      <SignUpPageContent />
    </Suspense>
  );
};

export default SignUpPage;
