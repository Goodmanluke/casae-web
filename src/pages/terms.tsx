import { useRouter } from "next/router";
import { logoSrc } from "../lib/logo";

export default function Terms() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

      <div className="relative z-10 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20">
              <img
                src={logoSrc}
                alt="CMAi logo"
                className="h-16 w-16 mx-auto drop-shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-white/60 text-sm">
              Effective Date: September 1, 2025
            </p>
            <p className="text-white/60 text-sm">Contact: support@cmai.app</p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-8 text-white/80">
                <section>
                  <p className="leading-relaxed mb-6">
                    Welcome to CMAi, an AI-powered real estate analysis
                    platform. These Terms of Service ("Terms") govern your
                    access to and use of CMAi's website, applications, services,
                    and related materials (collectively, the "Service"). By
                    accessing or using the Service, you agree to be bound by
                    these Terms. If you do not agree, you may not use the
                    Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    1. Eligibility
                  </h2>
                  <p className="leading-relaxed">
                    You must be at least 18 years old and able to form a legally
                    binding contract to use the Service. By using CMAi, you
                    represent and warrant that you meet these requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    2. Use of the Service
                  </h2>
                  <p className="leading-relaxed mb-3">
                    <strong className="text-white">License.</strong> CMAi grants
                    you a limited, non-exclusive, non-transferable, revocable
                    license to access and use the Service for your personal or
                    professional real estate analysis.
                  </p>
                  <p className="leading-relaxed mb-3">
                    <strong className="text-white">Restrictions.</strong> You
                    may not (i) reverse engineer, decompile, or disassemble the
                    Service; (ii) copy, modify, resell, sublicense, or
                    distribute the Service; (iii) use the Service for unlawful
                    purposes; or (iv) use the Service in a manner that violates
                    applicable real estate licensing, advertising, appraisal, or
                    data protection laws.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-white">No Advice.</strong> CMAi
                    provides automated estimates and analysis tools only.
                    Results are for informational purposes and do not constitute
                    professional appraisals, financial advice, investment
                    recommendations, or legal advice. You are solely responsible
                    for how you use the information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    3. Accounts
                  </h2>
                  <p className="leading-relaxed">
                    You must create an account to access most features. You
                    agree to provide accurate, complete information and keep it
                    updated. You are responsible for safeguarding your login
                    credentials and for all activities under your account. CMAi
                    is not liable for unauthorized access resulting from your
                    failure to protect your credentials.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    4. Subscriptions, Payments & Refunds
                  </h2>
                  <p className="leading-relaxed mb-3">
                    <strong className="text-white">Billing.</strong> Certain
                    features require a paid subscription. Payments are processed
                    securely by third-party providers (e.g., Stripe). By
                    subscribing, you authorize recurring charges to your payment
                    method.
                  </p>
                  <p className="leading-relaxed mb-3">
                    <strong className="text-white">Renewals.</strong>{" "}
                    Subscriptions automatically renew at the end of each billing
                    cycle unless canceled prior to renewal.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-white">Refunds.</strong> Except as
                    required by law or as expressly provided in the Refund
                    Policy, all fees are non-refundable.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    5. Data & Privacy
                  </h2>
                  <p className="leading-relaxed">
                    CMAi collects and processes data as described in our Privacy
                    Policy. You retain ownership of the data you input. By using
                    the Service, you grant CMAi a license to host, process, and
                    display your data as needed to operate and improve the
                    Service. CMAi may use anonymized, aggregated information for
                    analytics, benchmarking, and product enhancement.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    6. Disclaimers
                  </h2>
                  <p className="leading-relaxed">
                    The Service is provided "as is" and "as available." CMAi and
                    its suppliers expressly disclaim all warranties, whether
                    express, implied, or statutory, including the implied
                    warranties of merchantability, fitness for a particular
                    purpose, and non-infringement. CMAi does not guarantee the
                    accuracy, completeness, timeliness, or reliability of any
                    valuation, comparable selection, market analysis, or other
                    outputs. Outputs may vary and should not be relied upon as a
                    substitute for independent professional judgment.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    7. Limitation of Liability
                  </h2>
                  <p className="leading-relaxed">
                    To the fullest extent permitted by law, CMAi and its owners,
                    affiliates, officers, employees, agents, and partners will
                    not be liable for any indirect, incidental, special,
                    consequential, exemplary, or punitive damages (including
                    loss of profits, revenue, data, or goodwill), arising out of
                    or related to your use of or inability to use the Service,
                    even if advised of the possibility of such damages. CMAi's
                    total liability for any claim arising out of or relating to
                    the Service shall not exceed the amount you paid to CMAi for
                    the Service during the twelve (12) months immediately
                    preceding the claim.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    8. Intellectual Property
                  </h2>
                  <p className="leading-relaxed">
                    All software, documentation, text, graphics, logos,
                    trademarks, and other materials provided by CMAi are the
                    exclusive property of CMAi LLC or its licensors and are
                    protected by intellectual property laws. You may not copy,
                    modify, distribute, create derivative works, or use CMAi
                    intellectual property except as expressly permitted in these
                    Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    9. Termination
                  </h2>
                  <p className="leading-relaxed">
                    CMAi may suspend or terminate your access to the Service at
                    any time, with or without notice, if you violate these Terms
                    or misuse the Service. Upon termination, your right to use
                    the Service ceases immediately. Sections that by their
                    nature should survive termination (e.g., intellectual
                    property, disclaimers, limitations of liability, governing
                    law) shall survive.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    10. Governing Law & Dispute Resolution
                  </h2>
                  <p className="leading-relaxed">
                    These Terms are governed by the laws of the State of
                    Oklahoma, without regard to its conflict of law principles.
                    Any dispute, claim, or controversy arising out of or
                    relating to these Terms or the Service shall be resolved by
                    binding arbitration in Oklahoma County, Oklahoma,
                    administered by a recognized arbitration provider, except
                    that either party may seek injunctive or other equitable
                    relief in a court of competent jurisdiction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    11. Changes to Terms
                  </h2>
                  <p className="leading-relaxed">
                    CMAi may update these Terms from time to time. We will
                    notify you of material changes by email or through the
                    Service. Your continued use of the Service after the
                    effective date of any changes constitutes your acceptance of
                    the revised Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    12. Contact
                  </h2>
                  <p className="leading-relaxed">
                    For questions about these Terms, please contact:
                  </p>
                  <p className="leading-relaxed mt-2">
                    <strong className="text-white">CMAi LLC</strong>
                    <br />
                    Email: support@cmai.app
                  </p>
                </section>
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-12 text-center">
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push("/signup");
                  }
                }}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
