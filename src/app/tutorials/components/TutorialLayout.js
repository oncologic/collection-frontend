"use client";
import { useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle, FaSpinner } from "react-icons/fa";

const TutorialLayout = ({
  children,
  title,
  category = "Tutorial",
  icon: IconComponent,
  isLoading = false,
  error = null,
  totalSections = 0,
  completedSections = new Set(),
  onMarkComplete,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading tutorial content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">
              Error Loading Tutorial
            </h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <Link
              href="/tutorials"
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Tutorials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage =
    totalSections > 0 ? (completedSections.size / totalSections) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/tutorials"
              className="flex items-center text-slate-300 hover:text-white transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              Back to Tutorials
            </Link>
            {totalSections > 0 && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-400">
                  Progress: {completedSections.size}/{totalSections} sections
                </div>
                <div className="w-32 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center animate-fade-in">
            {IconComponent && (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
                <IconComponent className="h-10 w-10 text-white" />
              </div>
            )}
            <span className="inline-block px-3 py-1 text-sm font-medium bg-purple-500/20 text-purple-300 rounded-full mb-4">
              {category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {children}

        {/* Completion Section */}
        {totalSections > 0 && completedSections.size === totalSections && (
          <div className="mt-16 text-center animate-fade-in">
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-8">
              <FaCheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Tutorial Complete!
              </h3>
              <p className="text-slate-300 mb-6">
                Congratulations! You&apos;ve completed this tutorial. Continue
                exploring to master more features.
              </p>
              <Link
                href="/tutorials"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Explore More Tutorials
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TutorialLayout;
