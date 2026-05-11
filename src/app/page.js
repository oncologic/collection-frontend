"use client";
export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaCalendar,
  FaSearch,
  FaUsers,
  FaFlask,
  FaChartBar,
  FaShieldAlt,
  FaRocket,
  FaBrain,
  FaHeart,
  FaGlobe,
  FaArrowRight,
  FaPlay,
  FaCheck,
  FaStar,
  FaQuoteLeft,
  FaMagic,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import Header from "./components/Header";

const FeatureCard = ({ icon: Icon, title, description, gradient }) => (
  <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-2">
    <div
      className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
    >
      <Icon className="text-2xl text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const StatCard = ({ number, label, suffix = "" }) => (
  <div className="text-center">
    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent mb-2">
      {number}
      {suffix}
    </div>
    <div className="text-gray-200 font-medium">{label}</div>
  </div>
);

const TestimonialCard = ({ quote, author, role, avatar }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
    <FaQuoteLeft className="text-blue-500 text-2xl mb-4" />
    <p className="text-gray-700 mb-6 italic leading-relaxed">
      &quot;{quote}&quot;
    </p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
        {avatar}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{author}</div>
        <div className="text-gray-600 text-sm">{role}</div>
      </div>
    </div>
  </div>
);

function HomeContent() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const [activeTab, setActiveTab] = useState("kidney");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set active tab based on URL parameter
    if (tenantParam === "personal") {
      setActiveTab("personal");
    } else if (tenantParam === "kidney") {
      setActiveTab("kidney");
    }
    // Default to kidney if no param or invalid param
  }, [tenantParam]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const kidneyFeatures = [
    {
      icon: FaFlask,
      title: "Clinical Trials Access",
      description:
        "Discover research opportunities from clinicaltrials.gov and other sources with AI summaries and combined search results.",
      gradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    {
      icon: FaMagic,
      title: "AI-Powered Insights",
      description:
        "Get personalized suggestions and insights powered by advanced AI tuned to the latest approved cancer resources and organizations.",
      gradient: "bg-gradient-to-r from-purple-500 to-indigo-500",
    },
    {
      icon: FaUsers,
      title: "Expert Community",
      description:
        "Discover resources featuring leading oncologists, researchers, and patient advocates to stay up to date on the latest cancer research and treatments.",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500",
    },
    {
      icon: FaHeart,
      title: "Patient Support",
      description:
        "Discover comprehensive resources, support groups, and educational materials provided by verified organizations.",
      gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
    },
  ];

  const personalFeatures = [
    {
      icon: FaRocket,
      title: "Smart Organization",
      description:
        "Organize your thoughts, projects, and goals with AI-powered categorization and intelligent linking between related content.",
      gradient: "bg-gradient-to-r from-orange-500 to-red-500",
    },
    {
      icon: FaChartBar,
      title: "Advanced Analytics",
      description:
        "Track your productivity, analyze patterns, and get insights into your work habits with comprehensive analytics dashboards.",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500",
    },
    {
      icon: FaGlobe,
      title: "Team Collaboration",
      description:
        "Seamlessly collaborate with team members, share workspaces, and manage projects with enterprise-grade security.",
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-500",
    },
    {
      icon: FaShieldAlt,
      title: "Privacy & Security",
      description:
        "Secure authentication with SSO support, role-based access control, and multi-tenant data isolation keep your information private.",
      gradient: "bg-gradient-to-r from-gray-600 to-gray-800",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div
            className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8 mt-12">
              <FaStar className="mr-2" />
              {activeTab === "kidney"
                ? "Built for patients, caregivers, non-profits organizations, and healthcare professionals"
                : "Your personal AI-powered productivity workspace"}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-8">
              {activeTab === "kidney" ? (
                <>
                  Events, Resources, and
                  <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    {" "}
                    AI-Powered{" "}
                  </span>
                  Productivity
                </>
              ) : (
                <>
                  Your Personal
                  <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    {" "}
                    AI Workspace{" "}
                  </span>
                  for Life
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
              {activeTab === "kidney"
                ? "Contexlia is a resource hub that provides access to curated and trusted resources for those affected by cancer, caregivers, and healthcare professionals."
                : "Organize your life, track your goals, and boost your productivity with AI-powered insights and intelligent organization."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href={
                  activeTab === "personal"
                    ? `/sign-up?tenant=personal`
                    : `/sign-up`
                }
                className="inline-block"
              >
                <div className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-slate-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-slate-800 transition-all duration-300 flex items-center gap-3 cursor-pointer shadow-lg hover:shadow-xl">
                  <FaRocket className="group-hover:rotate-12 transition-transform duration-300" />
                  Get Started
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>

              {activeTab === "kidney" && (
                <Link href="/resources" className="inline-block">
                  <div className="group px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 flex items-center gap-3">
                    <FaSearch className="text-slate-600" />
                    Preview Resources
                  </div>
                </Link>
              )}
            </div>

            {/* Platform Selector */}
            <div className="bg-white rounded-xl p-2 shadow-xl border border-slate-200 inline-flex">
              <Link href="/?tenant=kidney">
                <button
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === "kidney"
                      ? "bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Medical Resource Hub
                </button>
              </Link>
              <Link href="/?tenant=personal">
                <button
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === "personal"
                      ? "bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Personal Workspace
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {activeTab === "kidney"
                ? "Staying Informed "
                : "Supercharge Your Productivity"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {activeTab === "kidney"
                ? "Comprehensive tools and resources designed to help locate and access resources for cancer patients, caregivers, and healthcare professionals."
                : "Transform how you work with AI-powered organization, collaboration tools, and intelligent insights."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(activeTab === "kidney" ? kidneyFeatures : personalFeatures).map(
              (feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <FeatureCard {...feature} />
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-24 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Contexlia?
            </h2>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto">
              {activeTab === "kidney"
                ? "Built with cutting-edge technology to deliver the best experience for healthcare professionals and patients"
                : "Powered by advanced AI to help you organize, track, and achieve your personal and professional goals"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <FaMagic className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
              <p className="text-slate-300">
                Advanced AI for personalized recommendations and insights
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <FaShieldAlt className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reliable</h3>
              <p className="text-slate-300">
                Resources created by leading organizations and medical
                professionals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <FaHeart className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Patient-First
              </h3>
              <p className="text-slate-300">
                Designed with patients and caregivers at the center. Experience
                driven design.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <FaRocket className="text-2xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Innovative</h3>
              <p className="text-slate-300">
                Cutting-edge features built for the future of healthcare
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from the healthcare professionals and individuals who trust
              Contexia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Contexia has revolutionized how we connect patients with clinical trials. The AI-powered matching is incredibly accurate."
              author="Dr. Sarah Chen"
              role="Oncologist, Johns Hopkins"
              avatar="SC"
            />
            <TestimonialCard
              quote="As a kidney cancer patient, having all resources in one secure platform has been life-changing. The community support is invaluable."
              author="Michael Rodriguez"
              role="Patient Advocate"
              avatar="MR"
            />
            <TestimonialCard
              quote="The personal workspace has transformed our team's productivity. The AI insights help us make better decisions faster."
              author="Jennifer Kim"
              role="Research Director"
              avatar="JK"
            />
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Be among the first to experience the next generation of healthcare
              research and productivity tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <div className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-slate-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-slate-800 transition-all duration-300 flex items-center gap-3 text-lg shadow-lg hover:shadow-xl">
                  Get Started
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>

              <Link
                href={
                  activeTab === "personal"
                    ? "/pricing?tenant=personal"
                    : "/pricing"
                }
              >
                <div className="px-10 py-5 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 text-lg">
                  View Pricing
                </div>
              </Link>
            </div>

            {/* <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 flex items-center justify-center">
                  <img
                    src="/images/Contexlia.png"
                    alt="Contexlia Logo"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <span className="text-2xl font-bold">Contexlia</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering patients, healthcare professionals and organizations
                with intelligent platforms for research, collaboration, and
                productivity.
              </p>
              <div className="text-sm text-gray-500">
                © {new Date().getFullYear()} Contexlia. All rights reserved.
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Resources</li>
                <li>Events</li>
                <li>Organizations</li>
                <li>Clinical Trials</li>
                <li>Collections</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
