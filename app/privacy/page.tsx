import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Mini Games Portal",
  description: "Privacy Policy for Mini Games Portal",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to Mini Games Portal
          </Link>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: April 28, 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
            <p>Mini Games Portal ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights regarding your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Data We Collect</h2>
            <p>We collect the following types of data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Wallet address:</strong> Your public blockchain wallet address, used to identify you on-chain and track game sessions.</li>
              <li><strong>Game data:</strong> Game results, scores, points, and session history.</li>
              <li><strong>Profile data:</strong> Username, avatar, and preferences you set voluntarily.</li>
              <li><strong>Authentication data:</strong> If you sign in via OAuth (Google, GitHub), we receive your email and profile picture from that provider.</li>
              <li><strong>Technical data:</strong> Browser type, device type, and anonymous usage analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Display your game history, scores, and leaderboard ranking.</li>
              <li>Enable multiplayer features and tournaments.</li>
              <li>Improve the App and fix bugs.</li>
              <li>Send optional notifications about tournaments or challenges (only if you opt in).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. Blockchain Data</h2>
            <p>On-chain game transactions are recorded on public blockchains (Celo, Base, MegaETH, Soneium). This data is public by nature and outside our control. Your wallet address and transaction history are visible to anyone on the blockchain.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase:</strong> Our database provider, for storing user profiles and game data.</li>
              <li><strong>Vercel:</strong> Our hosting provider, for serving the App.</li>
              <li><strong>Third-party wallets:</strong> Your wallet app (e.g., MiniPay, MetaMask) processes blockchain transactions independently.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Cookies & Local Storage</h2>
            <p>We use cookies and local storage to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Remember your wallet connection and preferences.</li>
              <li>Store local game statistics.</li>
              <li>Maintain your session.</li>
            </ul>
            <p className="mt-2">We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Data Retention</h2>
            <p>We retain your data as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Data portability.</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:philv2dot1@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">philv2dot1@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">9. Security</h2>
            <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">10. Children's Privacy</h2>
            <p>The App is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">12. Contact</h2>
            <p>For any privacy-related questions, contact us at <a href="mailto:philv2dot1@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">philv2dot1@gmail.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link href="/terms" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
