import ThemeToggle from "../components/ThemeToggle"

export default function Privacy() {
  return (
    <>
      <ThemeToggle />
      <div className="legal-page">
        <h2>Privacy Policy</h2>
        <p className="legal-updated">Last updated: April 2026</p>

        <p>
          Flipt (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy.
          This policy explains what data we collect, how we use it, and your rights as a user.
        </p>

        <h3>What We Collect</h3>
        <ul>
          <li><strong>Photos you upload</strong> &mdash; When you scan an item, the photo is sent to our AI provider (Anthropic) for analysis. We do not store your photos on our servers after processing is complete.</li>
          <li><strong>Scan results</strong> &mdash; Item identification data, price estimates, and listing suggestions are stored locally on your device using your browser&apos;s localStorage. This data never leaves your device unless you choose to share it.</li>
          <li><strong>Preferences</strong> &mdash; Theme settings, scan counts, referral codes, and feature preferences are stored locally on your device.</li>
          <li><strong>Email address</strong> &mdash; Only if you subscribe to our weekly market report. We use this solely to send you the report.</li>
        </ul>

        <h3>How We Use Your Data</h3>
        <ul>
          <li>Photos are processed through the Anthropic Claude API to identify items, estimate values, and generate listing descriptions.</li>
          <li>Scan history is stored locally to provide you with a record of your scans and to power features like your closet, marketplace listings, and business analytics.</li>
          <li>Aggregate, anonymized usage patterns may be used to improve the service.</li>
        </ul>

        <h3>What We Do Not Do</h3>
        <ul>
          <li>We <strong>do not</strong> store your photos permanently. Photos are transmitted to Anthropic for processing and are not retained by Flipt after the scan is complete.</li>
          <li>We <strong>do not</strong> sell your personal data to anyone, ever.</li>
          <li>We <strong>do not</strong> share your data with third parties, except Anthropic for AI processing as described above.</li>
          <li>We <strong>do not</strong> track your browsing activity outside of the Flipt app.</li>
        </ul>

        <h3>Data Storage and Retention</h3>
        <p>
          All scan results, closet items, marketplace listings, watchlists, and preferences are stored locally
          on your device using browser localStorage. This means your data stays on your device and is not transmitted to or stored on our servers.
          If you clear your browser data, this information will be permanently deleted.
        </p>

        <h3>Third-Party Services</h3>
        <p>
          We use the <strong>Anthropic Claude API</strong> to power our AI scanning features. When you upload a photo,
          it is sent to Anthropic&apos;s servers for processing. Anthropic&apos;s data handling practices are governed by their
          own privacy policy. We encourage you to review it at anthropic.com.
        </p>
        <p>
          We load fonts from <strong>Google Fonts</strong> and placeholder images from <strong>Unsplash</strong>.
          These services may collect basic access logs as described in their respective privacy policies.
        </p>

        <h3>Cookies</h3>
        <p>
          Flipt does not use cookies for tracking or advertising. We use browser localStorage to save your preferences
          and scan data. No third-party cookies are set by our application.
        </p>

        <h3>Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access your data</strong> &mdash; All your data is stored locally on your device and is accessible to you at any time through the app.</li>
          <li><strong>Delete your data</strong> &mdash; You can clear all Flipt data by clearing your browser&apos;s localStorage, or by using the &ldquo;Clear History&rdquo; button within the app.</li>
          <li><strong>Opt out</strong> &mdash; You can unsubscribe from the market report at any time. Simply stop using the app to cease all data processing.</li>
        </ul>

        <h3>Children&apos;s Privacy</h3>
        <p>
          Flipt is intended for users aged 13 and older. We do not knowingly collect data from children under 13.
          If you believe a child under 13 has used our service, please contact us and we will take appropriate action.
        </p>

        <h3>Changes to This Policy</h3>
        <p>
          We may update this privacy policy from time to time. When we make significant changes,
          we will notify users through the app. Continued use of Flipt after changes constitutes acceptance of the updated policy.
        </p>

        <h3>Contact Us</h3>
        <p>
          If you have questions about this privacy policy or your data, contact us at{" "}
          <a href="mailto:privacy@flipt.app">privacy@flipt.app</a>.
        </p>
      </div>
    </>
  )
}
