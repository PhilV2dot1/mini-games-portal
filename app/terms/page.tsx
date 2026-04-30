import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Mini Games Portal",
  description: "Terms of Service for Mini Games Portal",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Mini Games Portal
          </Link>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: April 28, 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Mini Games Portal ("the App"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
            <p>Mini Games Portal is a web application that allows users to play mini-games in free mode or on-chain mode using blockchain technology on networks including Celo, Base, MegaETH, and Soneium. Some games may require small transaction fees paid in the native cryptocurrency of the selected network.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Eligibility</h2>
            <p>You must be at least 18 years old to use the on-chain features of this App. By using the App, you represent that you meet this requirement and that your use complies with all applicable laws in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Blockchain Transactions</h2>
            <p>On-chain game modes involve real cryptocurrency transactions. You acknowledge that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>All blockchain transactions are irreversible once confirmed.</li>
              <li>Transaction fees (gas) are determined by the network and may vary.</li>
              <li>We are not responsible for any loss of funds due to user error, network issues, or smart contract interactions.</li>
              <li>Cryptocurrency values are volatile and may fluctuate significantly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. User Responsibilities</h2>
            <p>You are solely responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Keeping your wallet credentials secure.</li>
              <li>Any transactions made from your connected wallet.</li>
              <li>Complying with applicable laws and regulations in your jurisdiction.</li>
              <li>Not using the App for any illegal or unauthorized purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. No Gambling Warranty</h2>
            <p>The App is intended for entertainment purposes. We do not guarantee winnings or returns. On-chain game outcomes are determined by smart contract logic and are transparent and verifiable on the blockchain.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Intellectual Property</h2>
            <p>All content, logos, and game assets on Mini Games Portal are the property of their respective owners. You may not copy, reproduce, or distribute any content without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. Disclaimer of Warranties</h2>
            <p>The App is provided "as is" without warranties of any kind. We do not warrant that the App will be uninterrupted, error-free, or free of harmful components.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including loss of cryptocurrency or digital assets.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
            <p>We reserve the right to update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">11. Contact</h2>
            <p>For questions about these Terms, please contact us at <a href="mailto:philv2dot1@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">philv2dot1@gmail.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link href="/privacy" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
