"use client";
import React from "react";
import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-gray-700">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Privacy Policy
        </h1>
        <p className="text-right text-gray-600 mb-6">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <p className="mb-6">
          Thank you for trusting Contexlia (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;), operated by OncoLogic Inc., with your information.
          We build tools that empower patients with reliable resources,
          including an AI‑enabled chatbot (&quot;AI-powered chatbot&quot;) and
          related web and mobile services (collectively, the
          &quot;Services&quot;). Protecting your privacy is fundamental to our
          mission. This Privacy Policy explains how we collect, use, disclose
          and protect information about you and the rights and choices you have.
        </p>

        <div className="p-4 bg-gray-100 border-l-4 border-blue-500 mb-6">
          <p className="italic">
            If you do not agree with any part of this Privacy Policy, please do
            not use our Services.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4" id="scope">
          1. Scope & Definitions
        </h2>
        <p className="mb-4">
          This Privacy Policy applies to personal data we process when you:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>visit our websites or mobile apps,</li>
          <li>create an account or log in,</li>
          <li>interact with our AI-powered chatbot,</li>
          <li>participate in research or surveys, or</li>
          <li>otherwise communicate with us.</li>
        </ul>
        <p className="mb-6">
          <strong>&quot;Personal data&quot;</strong> (&quot;personal
          information&quot;) means any information that identifies, relates to,
          describes, or could reasonably be linked to you.{" "}
          <strong>&quot;Sensitive data&quot;</strong> includes health
          information, precise geolocation, genetic data, and other special
          categories defined by law.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="collection">
          2. Information We Collect
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-left">Examples</th>
                <th className="py-2 px-4 border-b text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b font-medium">
                  Account & Contact Info
                </td>
                <td className="py-2 px-4 border-b">
                  name, email address, password (hashed), authentication tokens,
                  communication preferences
                </td>
                <td className="py-2 px-4 border-b">You</td>
              </tr>

              <tr>
                <td className="py-2 px-4 border-b font-medium">Usage Data</td>
                <td className="py-2 px-4 border-b">
                  IP address, device type, browser, referrer, pages viewed,
                  session timestamps
                </td>
                <td className="py-2 px-4 border-b">Automated</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">
                  Cookies & Local Storage
                </td>
                <td className="py-2 px-4 border-b">
                  authentication state, user preferences, caching for faster
                  load times
                </td>
                <td className="py-2 px-4 border-b">Automated</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6">
          We do <strong>not</strong> knowingly collect data from children under
          13. See § 12.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="usage">
          3. How We Use Information
        </h2>
        <p className="mb-4">We process personal data to:</p>
        <ol className="list-decimal ml-8 mb-6">
          <li className="mb-2">
            <strong>Provide the Services</strong> – create your account,
            authenticate you, deliver resources, and enable chatbot
            conversations.
          </li>

          <li className="mb-2">
            <strong>Security & Fraud Prevention</strong> – detect, investigate,
            and prevent malicious or unauthorized activity.
          </li>
          <li className="mb-2">
            <strong>Research & Development</strong> – conduct internal analytics
            and aggregated, de‑identified studies.
          </li>
          <li className="mb-2">
            <strong>Legal & Compliance</strong> – meet obligations under
            applicable laws (e.g., GDPR, TDPSA, CPRA) and respond to lawful
            requests.
          </li>
          <li className="mb-2">
            <strong>Communications</strong> – send service notices, product
            updates, marketing (with opt‑out), and respond to inquiries.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mb-4" id="legal-bases">
          4. Legal Bases for Processing (GDPR/UK GDPR)
        </h2>
        <p className="mb-4">
          When we process data of users in the EEA, UK, or Switzerland, we rely
          on:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            <strong>Consent</strong> (e.g., storing optional cookies, collecting
            sensitive health info);
          </li>
          <li>
            <strong>Contract</strong> (to provide the Services you request);
          </li>
          <li>
            <strong>Legitimate Interests</strong> (to secure and improve
            Services, provided your rights do not override);
          </li>
          <li>
            <strong>Legal Obligation</strong> (tax, accounting, consumer
            protection regulations);
          </li>
          <li>
            <strong>Vital Interests</strong> (rare instances to protect life or
            safety);
          </li>
          <li>
            <strong>Public Interest / Research</strong> (where recognized by
            law).
          </li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="ai">
          5. AI & Automated Decision‑Making
        </h2>
        <p className="mb-6">
          Our AI-powered chatbot generates responses using commercially
          available models.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="cookies">
          6. Cookies & Similar Technologies
        </h2>
        <p className="mb-4">
          We use the following types of cookies and local‑storage objects:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            <strong>Strictly Necessary</strong> – authentication, session
            management.
          </li>
          <li>
            <strong>Performance</strong> – caching content, load balancing.
          </li>
          <li>
            <strong>Analytics</strong> – aggregated usage statistics (e.g.,
            Matomo, Plausible).
          </li>
        </ul>
        <p className="mb-6">
          Your browser or device settings allow you to block or delete cookies;
          however, the Services may not function properly without them. We honor
          Global Privacy Control (GPC) signals where required.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="disclosure">
          7. Disclosure of Information
        </h2>
        <p className="mb-4">
          We never sell personal data. We may share categories in § 2 with:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            <strong>Service Providers & Sub‑Processors</strong> (cloud hosting,
            authentication, analytics, email delivery) bound by strong
            confidentiality agreements;
          </li>
          <li>
            <strong>Research Partners</strong> – only de‑identified or
            aggregated data unless you give explicit consent;
          </li>
          <li>
            <strong>Legal or Regulatory Bodies</strong> – in response to lawful
            requests or to protect rights, safety, or property;
          </li>
          <li>
            <strong>Business Transfers</strong> – in connection with a merger,
            acquisition, or asset sale (you will be notified and may opt out of
            materially different practices);
          </li>
          <li>
            <strong>With Your Consent</strong> – when you authorize sharing
            (e.g., exporting data to another app study).
          </li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="retention">
          8. Data Retention
        </h2>
        <p className="mb-4">
          We retain personal data only as long as needed for the purposes
          described or as required by law:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            Account data – while your account is active + 90 days for backup
            integrity.
          </li>
        </ul>
        <p className="mb-6">We review retention schedules annually.</p>

        <h2 className="text-xl font-semibold mb-4" id="security">
          9. Security Measures
        </h2>
        <p className="mb-4">
          We implement industry-standard administrative, technical, and physical
          safeguards to protect your data, including:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            TLS 1.3 encryption for data in transit and secure encryption for
            data at rest;
          </li>
          <li>
            Role-based access controls and multi-factor authentication for our
            staff;
          </li>
          <li>Regular security assessments and vulnerability scanning;</li>
          <li>Security monitoring and incident response procedures;</li>
          <li>Strong data protection agreements with our service providers.</li>
        </ul>
        <p className="mb-6">
          No system can be 100% secure, but we strive to protect your data using
          modern security practices.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="rights">
          10. Your Rights & Choices
        </h2>
        <p className="mb-4">
          Depending on where you live, you may have the right to:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">Right</th>
                <th className="py-2 px-4 border-b text-left">Jurisdictions</th>
                <th className="py-2 px-4 border-b text-left">
                  How to Exercise
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b">Access / Know</td>
                <td className="py-2 px-4 border-b">GDPR, CPRA, TDPSA, etc.</td>
                <td className="py-2 px-4 border-b">Contact us</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Correction</td>
                <td className="py-2 px-4 border-b">GDPR, CPRA</td>
                <td className="py-2 px-4 border-b">Same as above</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Deletion</td>
                <td className="py-2 px-4 border-b">
                  GDPR (erasure), CPRA, TDPSA
                </td>
                <td className="py-2 px-4 border-b">Contact us</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b">Portability</td>
                <td className="py-2 px-4 border-b">GDPR, CPRA</td>
                <td className="py-2 px-4 border-b">Export JSON/CSV</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-6">
          We will verify your identity before fulfilling requests and respond
          within 30 days (or as required by law).
        </p>

        <h2 className="text-xl font-semibold mb-4" id="hipaa">
          11. HIPAA & Patient Data Notice
        </h2>
        <p className="mb-6">
          We are <strong>not</strong> a HIPAA-covered entity or business
          associate. While you may choose to store or submit health information
          on the platform, that data is not &quot;Protected Health
          Information&quot; (PHI) under HIPAA, because it is provided directly
          by you—not by a healthcare provider or insurer. We protect such
          information according to this Privacy Policy and all other applicable
          privacy laws (e.g., GDPR, CPRA, TDPSA).
        </p>

        <h2 className="text-xl font-semibold mb-4" id="children">
          12. Children&apos;s Privacy
        </h2>
        <p className="mb-6">
          Our Services are <strong>not</strong> directed to children under 13.
          If we learn we have collected information from a child under 13
          without verifiable parental consent, we will delete it immediately.
        </p>

        <h2 className="text-xl font-semibold mb-4" id="international">
          13. International Transfers
        </h2>
        <p className="mb-4">
          OncoLogic Inc. is headquartered in the United States. For users in the
          EEA, UK, or Switzerland, we rely on:
        </p>
        <ul className="list-disc ml-8 mb-6">
          <li>
            <strong>Adequacy decisions</strong> (where applicable);
          </li>
          <li>
            <strong>Standard Contractual Clauses</strong> and supplementary
            measures;
          </li>
          <li>
            Your <strong>explicit consent</strong> for certain sensitive
            transfers.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mb-4" id="changes">
          15. Changes to This Privacy Policy
        </h2>
        <p className="mb-6">
          We may update this Policy periodically. Material changes will be
          announced via email or in‑app notice at least 15 days before they take
          effect. The &quot;Last Updated&quot; date reflects the current
          version.
        </p>

        {/* <h2 className="text-xl font-semibold mb-4" id="contact">
          16. Contact Us
        </h2>
        <div className="mb-6">
          <p>
            <strong>Privacy Officer</strong>
          </p>
          <p>OncoLogic Inc.</p>
          <p>Contexlia Platform</p>
          <p>
            Email: <strong>privacy@oncologic.com</strong>
          </p>
          <p>Address: 1234 Innovation Way, Suite 100, Austin, TX 78701 USA</p>
        </div> */}

        <hr className="my-8" />
      </div>

      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-50 text-blue-500 rounded-lg transition-colors duration-200"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
