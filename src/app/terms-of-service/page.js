"use client";
import React from "react";
import Link from "next/link";

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-700">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Terms of Service
        </h1>
        <p className="text-right text-gray-600 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 mb-6">
          <p className="text-blue-800 font-medium">
            IMPORTANT: These terms govern your use of Contexlia, our kidney
            cancer research platform, including AI-powered features, medical
            content, and professional verification systems.
          </p>
        </div>

        <p className="mb-6">
          By accessing or using Contexlia (the &quot;Platform&quot;), operated
          by OncoLogic Inc. (&quot;OncoLogic&quot;, &quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms
          and Conditions (&quot;Terms&quot;). If you do not agree to these
          Terms, you may not use the Platform.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="platform-description">
          1. Platform Description
        </h2>
        <p className="mb-3">
          Contexlia provides cancer patients, caregivers, healthcare
          professionals, and researchers with:
        </p>
        <ul className="list-disc ml-6 mb-6 space-y-1">
          <li>AI-powered chat for research analysis and Q&A</li>
          <li>PubMed research paper search and collection tools</li>
          <li>Clinical trials database and analysis</li>
          <li>Educational resources and video content</li>
          <li>Community features for sharing information</li>
          <li>Professional verification for healthcare providers</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="user-roles">
          2. User Roles and Verification
        </h2>
        <div className="mb-3">
          <h3 className="font-medium mb-2">2.1 Role Categories</h3>
          <p className="mb-2">
            Users may register under the following categories:
          </p>
          <ul className="list-disc ml-6 mb-3 space-y-1">
            <li>
              <strong>Patients & Family:</strong> Patients and caregivers/family
              members
            </li>
            <li>
              <strong>Healthcare Professionals:</strong> Physicians, PAs, NPs,
              RNs (requires verification)
            </li>
            <li>
              <strong>Research & Advocacy:</strong> Researchers, patient
              advocates, organization staff
            </li>
          </ul>
        </div>
        <div className="mb-6">
          <h3 className="font-medium mb-2">2.2 Professional Verification</h3>
          <p className="mb-2">
            Healthcare professionals must provide valid credentials for
            verification:
          </p>
          <ul className="list-disc ml-6 mb-3 space-y-1">
            <li>
              NPI numbers for physicians, physician assistants, and nurse
              practitioners
            </li>
            <li>Nursing license numbers for registered nurses</li>
            <li>Industry verification for foundation/organization staff</li>
          </ul>
          <p className="mb-3">
            You represent that all credential information provided is accurate
            and current. Providing false information may result in immediate
            account termination.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4" id="ai-medical-disclaimers">
          3. AI-Powered Features and Medical Disclaimers
        </h2>
        <div className="p-4 bg-red-50 border-l-4 border-red-500 mb-3">
          <h3 className="font-bold text-red-800 mb-2">
            CRITICAL MEDICAL DISCLAIMER
          </h3>
          <p className="text-red-700 mb-2">
            The AI-powered chat and analysis features are FOR INFORMATIONAL
            PURPOSES ONLY and are NOT a substitute for professional medical
            advice, diagnosis, or treatment.
          </p>
        </div>
        <div className="mb-3">
          <h3 className="font-medium mb-2">3.1 AI Limitations</h3>
          <ul className="list-disc ml-6 mb-3 space-y-1">
            <li>
              AI responses may contain errors, inaccuracies, or outdated
              information
            </li>
            <li>
              AI cannot diagnose medical conditions or recommend specific
              treatments
            </li>
            <li>
              AI analysis of research papers and clinical trials is for
              educational purposes only
            </li>
            <li>
              Always consult qualified healthcare professionals for medical
              decisions
            </li>
          </ul>
        </div>
        <div className="mb-6">
          <h3 className="font-medium mb-2">3.2 Research Analysis</h3>
          <p className="mb-3">
            Our AI tools analyze PubMed publications and clinical trial data to
            help users understand research. This analysis is not peer-reviewed
            and should not be used as the basis for medical decisions.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4" id="user-content">
          4. User Content and Collections
        </h2>
        <div className="mb-3">
          <h3 className="font-medium mb-2">4.1 Your Content</h3>
          <p className="mb-3">
            You retain ownership of content you create, including collections,
            notes, and comments. By sharing content on the Platform, you grant
            us a license to host, display, and share that content as necessary
            to provide our services.
          </p>
        </div>
        <div className="mb-6">
          <h3 className="font-medium mb-2">4.2 Content Standards</h3>
          <p className="mb-2">All user content must:</p>
          <ul className="list-disc ml-6 mb-3 space-y-1">
            <li>
              Be respectful and appropriate for a medical/research community
            </li>
            <li>
              Not contain personal health information of others without consent
            </li>
            <li>Comply with applicable medical privacy laws (HIPAA, etc.)</li>
            <li>Not promote unproven or dangerous medical treatments</li>
            <li>Respect intellectual property rights</li>
          </ul>
        </div>

        <h2 className="text-xl font-semibold mb-4" id="privacy">
          5. Privacy and Data Protection
        </h2>
        <p className="mb-3">
          Your privacy is important to us. Our data practices are governed by
          our{" "}
          <Link
            href="/privacy-policy"
            className="text-blue-500 hover:underline"
          >
            Privacy Policy
          </Link>
          , which is incorporated into these Terms. Key points include:
        </p>
        <ul className="list-disc ml-6 mb-6 space-y-1">
          <li>We do not sell your personal data</li>
          <li>Professional credentials are securely stored and verified</li>
          {/* <li>
            Chat history and research activity may be analyzed to improve our AI
          </li> */}
          <li>You can export your data and delete your account at any time</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="prohibited-uses">
          6. Prohibited Uses
        </h2>
        <p className="mb-2">You may not use the Platform to:</p>
        <ul className="list-disc ml-6 mb-6 space-y-1">
          <li>Provide medical advice</li>
          <li>Share personal health information of others without consent</li>
          <li>Attempt to circumvent professional verification systems</li>
          <li>
            Use automated tools to scrape or download large amounts of data
          </li>
          <li>
            Promote unproven cancer treatments or &quot;miracle cures&quot;
          </li>
          <li>Engage in harassment or discriminatory behavior</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="subscription-terms">
          7. Subscription and Payment Terms
        </h2>
        <div className="mb-3">
          <h3 className="font-medium mb-2">7.1 Service Plans</h3>
          <p className="mb-3">
            We offer various subscription plans with different features and AI
            usage limits. Pricing and features are subject to change with
            notice.
          </p>
        </div>
        <div className="mb-6">
          <h3 className="font-medium mb-2">7.2 AI Usage Credits</h3>
          <p className="mb-3">
            AI chat features may be subject to usage limits based on your
            subscription plan. Additional credits may be purchased as needed.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4" id="intellectual-property">
          8. Intellectual Property
        </h2>
        <p className="mb-6">
          The Platform and its features are protected by intellectual property
          laws. Research papers and clinical trial data are owned by their
          respective publishers and organizations. Our AI analysis and platform
          features are proprietary.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="disclaimers">
          9. Disclaimers and Limitations
        </h2>
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 mb-3">
          <p className="text-yellow-800">
            THE PLATFORM IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES. WE
            DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
            MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
          </p>
        </div>
        <p className="mb-6">
          We are not liable for any damages arising from your use of the
          Platform, including any medical decisions made based on Platform
          content.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="termination">
          10. Account Termination
        </h2>
        <p className="mb-6">
          We may suspend or terminate accounts that violate these Terms, provide
          false information during verification, or engage in behavior harmful
          to our community. You may delete your account at any time.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="governing-law">
          11. Governing Law
        </h2>
        <p className="mb-6">
          These Terms are governed by Texas law. Disputes will be resolved
          through binding arbitration administered by the American Arbitration
          Association.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="changes">
          12. Changes to Terms
        </h2>
        <p className="mb-6">
          We may update these Terms periodically. Material changes will be
          communicated through the Platform or by email. Continued use
          constitutes acceptance of updated Terms.
        </p>

        {/* <h2 className="text-xl font-semibold mb-4" id="contact">
          13. Contact Information
        </h2>
        <div className="mb-6">
          <p className="mb-2">
            For questions about these Terms, contact us at:
          </p>
          <div className="ml-4">
            <p>
              <strong>Email:</strong> legal@oncologic.com
            </p>
            <p>
              <strong>Address:</strong> OncoLogic Inc.
            </p>
            <p>Legal Department</p>
            <p>1234 Innovation Way, Suite 100</p>
            <p>Austin, TX 78701 USA</p>
          </div>
        </div> */}

        <div className="border-t pt-4 mt-6">
          <p className="text-xs text-gray-500 text-center">
            By continuing to use Contexlia, you acknowledge that you have read,
            understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </div>

      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors duration-200"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default TermsOfService;
