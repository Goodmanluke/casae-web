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
              CMAi Legal Policies
            </h1>
            <p className="text-white/60 text-sm">
              Terms of Service • Privacy Policy • Disclaimer • Refund Policy
            </p>
            <p className="text-white/60 text-sm mt-2">
              Effective Date: September 1, 2025
            </p>
            <p className="text-white/60 text-sm">
              Contact: support@cmai.app
            </p>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-12 text-white/80">
                
                {/* TERMS OF SERVICE SECTION */}
                <section className="border-b border-white/20 pb-12">
                  <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    CMAi Terms of Service
                  </h1>
                  
                  <p className="leading-relaxed mb-6">
                    Welcome to CMAi, an AI-powered real estate analysis platform. These Terms of Service ("Terms") govern your access to and use of CMAi's website, applications, services, and related materials (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, you may not use the Service.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">1. Eligibility</h2>
                      <p className="leading-relaxed">
                        You must be at least 18 years old and able to form a legally binding contract to use the Service. By using CMAi, you represent and warrant that you meet these requirements.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">2. Use of the Service</h2>
                      <p className="leading-relaxed mb-3">
                        <strong className="text-white">License.</strong> CMAi grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal or professional real estate analysis.
                      </p>
                      <p className="leading-relaxed mb-3">
                        <strong className="text-white">Restrictions.</strong> You may not (i) reverse engineer, decompile, or disassemble the Service; (ii) copy, modify, resell, sublicense, or distribute the Service; (iii) use the Service for unlawful purposes; or (iv) use the Service in a manner that violates applicable real estate licensing, advertising, appraisal, or data protection laws.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">No Advice.</strong> CMAi provides automated estimates and analysis tools only. Results are for informational purposes and do not constitute professional appraisals, financial advice, investment recommendations, or legal advice. You are solely responsible for how you use the information.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">3. Accounts</h2>
                      <p className="leading-relaxed">
                        You must create an account to access most features. You agree to provide accurate, complete information and keep it updated. You are responsible for safeguarding your login credentials and for all activities under your account. CMAi is not liable for unauthorized access resulting from your failure to protect your credentials.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">4. Subscriptions, Payments & Refunds</h2>
                      <p className="leading-relaxed mb-3">
                        <strong className="text-white">Billing.</strong> Certain features require a paid subscription. Payments are processed securely by third-party providers (e.g., Stripe). By subscribing, you authorize recurring charges to your payment method.
                      </p>
                      <p className="leading-relaxed mb-3">
                        <strong className="text-white">Renewals.</strong> Subscriptions automatically renew at the end of each billing cycle unless canceled prior to renewal.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-white">Refunds.</strong> Except as required by law or as expressly provided in the Refund Policy, all fees are non-refundable.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">5. Data & Privacy</h2>
                      <p className="leading-relaxed">
                        CMAi collects and processes data as described in our Privacy Policy. You retain ownership of the data you input. By using the Service, you grant CMAi a license to host, process, and display your data as needed to operate and improve the Service. CMAi may use anonymized, aggregated information for analytics, benchmarking, and product enhancement.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">6. Disclaimers</h2>
                      <p className="leading-relaxed">
                        The Service is provided "as is" and "as available." CMAi and its suppliers expressly disclaim all warranties, whether express, implied, or statutory, including the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. CMAi does not guarantee the accuracy, completeness, timeliness, or reliability of any valuation, comparable selection, market analysis, or other outputs. Outputs may vary and should not be relied upon as a substitute for independent professional judgment.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">7. Limitation of Liability</h2>
                      <p className="leading-relaxed">
                        To the fullest extent permitted by law, CMAi and its owners, affiliates, officers, employees, agents, and partners will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages (including loss of profits, revenue, data, or goodwill), arising out of or related to your use of or inability to use the Service, even if advised of the possibility of such damages. CMAi's total liability for any claim arising out of or relating to the Service shall not exceed the amount you paid to CMAi for the Service during the twelve (12) months immediately preceding the claim.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">8. Intellectual Property</h2>
                      <p className="leading-relaxed">
                        All software, documentation, text, graphics, logos, trademarks, and other materials provided by CMAi are the exclusive property of CMAi LLC or its licensors and are protected by intellectual property laws. You may not copy, modify, distribute, create derivative works, or use CMAi intellectual property except as expressly permitted in these Terms.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">9. Termination</h2>
                      <p className="leading-relaxed">
                        CMAi may suspend or terminate your access to the Service at any time, with or without notice, if you violate these Terms or misuse the Service. Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive termination (e.g., intellectual property, disclaimers, limitations of liability, governing law) shall survive.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">10. Governing Law & Dispute Resolution</h2>
                      <p className="leading-relaxed">
                        These Terms are governed by the laws of the State of Oklahoma, without regard to its conflict of law principles. Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved by binding arbitration in Oklahoma County, Oklahoma, administered by a recognized arbitration provider, except that either party may seek injunctive or other equitable relief in a court of competent jurisdiction.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">11. Changes to Terms</h2>
                      <p className="leading-relaxed">
                        CMAi may update these Terms from time to time. We will notify you of material changes by email or through the Service. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">12. Contact</h2>
                      <p className="leading-relaxed">
                        For questions about these Terms, please contact:
                      </p>
                      <p className="leading-relaxed mt-2">
                        <strong className="text-white">CMAi LLC</strong><br />
                        Email: support@cmai.app
                      </p>
                    </div>
                  </div>
                </section>

                {/* PRIVACY POLICY SECTION */}
                <section className="border-b border-white/20 pb-12">
                  <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    CMAi Privacy Policy
                  </h1>
                  
                  <p className="leading-relaxed mb-6">
                    CMAi ("we," "our," "us") values your privacy. This Privacy Policy explains how we collect, use, share, and protect your information when you use our website, applications, and services (collectively, the "Service"). By using CMAi, you consent to this Policy.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">1. Information We Collect</h2>
                      
                      <h3 className="text-xl font-semibold text-white mb-2 mt-4">a. Information You Provide</h3>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Account details (e.g., name, email, password).</li>
                        <li>Billing or payment information processed securely by third-party providers such as Stripe.</li>
                        <li>Property data and other content you input into the Service.</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-white mb-2 mt-4">b. Information Collected Automatically</h3>
                      <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Log and usage data (e.g., IP address, browser type, pages visited, time spent).</li>
                        <li>Device and connection data.</li>
                        <li>Cookies and similar technologies used for functionality, preferences, and analytics.</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-white mb-2 mt-4">c. Third-Party Sources</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Data from third-party integrations and APIs (e.g., property or market data providers) to power analysis.</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Provide, maintain, and improve the Service.</li>
                        <li>Process transactions, manage subscriptions, and provide customer support.</li>
                        <li>Personalize features and content.</li>
                        <li>Communicate with you about service updates, security alerts, and promotions (where permitted).</li>
                        <li>Ensure security, prevent fraud or abuse, and comply with legal obligations.</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">3. Sharing of Information</h2>
                      <p className="leading-relaxed mb-3">
                        We do not sell your personal data. We may share information only in the following circumstances:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-white">Service Providers:</strong> With trusted vendors (e.g., hosting, analytics, payment processing) who process data on our behalf under appropriate safeguards.</li>
                        <li><strong className="text-white">Legal Obligations:</strong> When required by law, regulation, or valid legal request.</li>
                        <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, financing, or sale of assets, subject to standard confidentiality obligations.</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">4. Data Retention</h2>
                      <p className="leading-relaxed">
                        We retain personal data for as long as your account is active or as needed to provide the Service. We may also retain anonymized, aggregated information for analytics and product improvement. Retention periods may vary depending on legal, regulatory, or contractual requirements.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">5. Security</h2>
                      <p className="leading-relaxed">
                        We implement reasonable technical and organizational measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">6. Your Rights</h2>
                      <p className="leading-relaxed">
                        Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or delete your information; to object to or restrict certain processing; and to opt out of marketing communications. To exercise these rights, contact us at support@cmai.app.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">7. Cookies & Tracking Technologies</h2>
                      <p className="leading-relaxed">
                        We use cookies and similar technologies for core functionality, preferences, and analytics. You may control cookies through your browser settings, but disabling cookies may limit some Service features.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">8. Children's Privacy</h2>
                      <p className="leading-relaxed">
                        The Service is not intended for individuals under 18, and we do not knowingly collect personal data from children. If we learn that we have collected data from a minor, we will delete it promptly.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">9. International Users</h2>
                      <p className="leading-relaxed">
                        If you access the Service from outside the United States, your data may be processed and stored in the U.S., where privacy laws may differ from those in your jurisdiction.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">10. Changes to this Policy</h2>
                      <p className="leading-relaxed">
                        We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Your continued use after the effective date constitutes acceptance of the updated Policy.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">11. Contact Us</h2>
                      <p className="leading-relaxed">
                        For questions or requests regarding this Privacy Policy, please contact:
                      </p>
                      <p className="leading-relaxed mt-2">
                        <strong className="text-white">CMAi LLC</strong><br />
                        Email: support@cmai.app
                      </p>
                    </div>
                  </div>
                </section>

                {/* DISCLAIMER SECTION */}
                <section className="border-b border-white/20 pb-12">
                  <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    CMAi Disclaimer
                  </h1>
                  
                  <p className="leading-relaxed mb-4">
                    The information provided by CMAi (the "Service") is for informational and educational purposes only. CMAi uses automated tools and third-party data to generate property valuations, comparable sales, and market analysis.
                  </p>

                  <ul className="list-disc pl-6 space-y-3 leading-relaxed mb-6">
                    <li>CMAi is not a licensed appraiser, real estate broker, financial advisor, or legal professional.</li>
                    <li>Outputs from CMAi do not constitute appraisals, legal advice, financial advice, or investment recommendations.</li>
                    <li>All results are estimates only and may not reflect actual market value or conditions.</li>
                    <li>You are solely responsible for any decisions you make based on CMAi's results. We recommend consulting qualified professionals before making financial, legal, or real estate decisions.</li>
                  </ul>

                  <p className="leading-relaxed">
                    By using CMAi, you acknowledge and agree that you use the Service at your own risk, and CMAi is not responsible for any actions taken based on its outputs.
                  </p>

                  <p className="leading-relaxed mt-4">
                    <strong className="text-white">Contact:</strong> support@cmai.app
                  </p>
                </section>

                {/* REFUND POLICY SECTION */}
                <section>
                  <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    CMAi Refund Policy
                  </h1>

                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Overview</h2>
                      <p className="leading-relaxed">
                        Because access to the Service begins immediately upon purchase and involves instant delivery of digital content and data, all subscription payments are non-refundable, except as required by law.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">1. Subscriptions & Renewals</h2>
                      <p className="leading-relaxed">
                        Subscriptions renew automatically at the end of each billing cycle unless canceled in advance. You may cancel at any time through your account settings. Cancellation prevents future charges but does not entitle you to a refund for the current billing period.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">2. Exceptions</h2>
                      <p className="leading-relaxed">
                        Refunds may be considered only for: (a) duplicate charges for the same subscription; or (b) a verified technical issue that prevents access to the Service and cannot be resolved within a reasonable timeframe by our support team.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">3. Trials & Discounts</h2>
                      <p className="leading-relaxed">
                        If a free trial or promotional discount is offered, standard charges will apply automatically once the trial or discount period ends unless canceled prior to renewal. Refunds are not issued for unused trial periods, partial months, or unused subscription time.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">4. Disputes</h2>
                      <p className="leading-relaxed">
                        If you believe you were charged in error, please contact us at support@cmai.app before initiating a dispute with your bank or card provider. Working directly with us helps ensure faster, smoother resolutions.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">5. Contact</h2>
                      <p className="leading-relaxed">
                        For billing or refund-related questions, contact:
                      </p>
                      <p className="leading-relaxed mt-2">
                        <strong className="text-white">CMAi LLC</strong><br />
                        Email: support@cmai.app
                      </p>
                    </div>
                  </div>
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
                    router.push('/signup');
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
