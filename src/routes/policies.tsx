import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policies — Rainbow Sports" },
      { name: "description", content: "Return, replacement, refund and privacy policies for Rainbow Sports." },
    ],
  }),
  component: Policies,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-3xl text-primary">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Policies() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-5xl">POLICIES</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Return, replacement, refund and privacy information.
      </p>

      <Section title="Shipping Policy">
        <p>We aim to dispatch all orders promptly and deliver them within the estimated time frame.</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Orders are typically delivered within <strong>10 to 15 business days</strong> from the date of order confirmation and/or payment.</li>
          <li>Delivery time may vary depending on your location, the courier service performance, or unforeseen delays.</li>
          <li>Once your order is shipped, you will receive tracking details via email or SMS.</li>
          <li>We are not responsible for delays caused by courier services or force majeure events (e.g., natural disasters, strikes, or government restrictions).</li>
        </ul>
        <p className="font-semibold">Shipping Charges:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Shipping fees (if applicable) will be calculated and displayed at checkout.</li>
          <li>Free shipping may be available on select items or order values.</li>
        </ul>
      </Section>

      <Section title="Return Policy">
        <p>
          We offer a <strong>7-day return window</strong>, which means you can request a return within 7 days of receiving your item.
        </p>
        <p className="font-semibold">To be eligible for a return:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>The item must be unused and in its original packaging.</li>
          <li>You must provide the receipt or proof of purchase.</li>
        </ul>
        <p>
          To initiate a return, send us an email. Once your return request is approved, we will provide you with instructions on how and where to send the item.
        </p>
        <p className="font-semibold">Please note:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Items returned without prior authorization will not be accepted.</li>
        </ul>
      </Section>

      <Section title="Replacement Policy">
        <p>
          If you receive a damaged or defective item, please report it to us within <strong>48 hours of delivery</strong> along with photos/videos as proof.
        </p>
        <p className="font-semibold">Once we receive and inspect the returned item:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>We will confirm the eligibility for a replacement.</li>
          <li>If approved, a replacement will be delivered within 7-10 business days.</li>
          <li>Replacements are subject to stock availability. If a replacement is not available, we may offer a refund or an alternative item.</li>
        </ul>
      </Section>

      <Section title="Refund Policy">
        <p>
          After we receive and inspect your return, we'll notify you via email or message regarding the status of your refund.
        </p>
        <p className="font-semibold">If approved:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your refund will be credited automatically to your original method of payment within 10 business days.</li>
          <li>You will receive a confirmation once the refund is issued.</li>
        </ul>
        <p className="font-semibold">Please note:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your bank or credit card provider may take additional time to reflect the refund in your account.</li>
          <li>Shipping charges (if any) are non-refundable unless the return is due to our error (e.g., defective or wrong item).</li>
        </ul>
      </Section>

      <Section title="Privacy Policy">
        <p>We are committed to protecting your personal information.</p>

        <h3 className="mt-4 font-display text-xl">Information We Collect</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>Name</li>
          <li>Phone number</li>
          <li>Email address</li>
          <li>Delivery address</li>
          <li>Order &amp; payment-related details</li>
        </ul>
        <p className="text-muted-foreground">(We do NOT store card/UPI details.)</p>

        <h3 className="mt-4 font-display text-xl">How We Use Your Information</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>To process and deliver your order</li>
          <li>To send order updates &amp; tracking</li>
          <li>To provide customer support</li>
        </ul>

        <h3 className="mt-4 font-display text-xl">Payment Security</h3>
        <p>All payments are handled through secure, trusted gateways.</p>

        <h3 className="mt-4 font-display text-xl">Sharing of Information</h3>
        <p>We never sell your data. Your details are shared only with courier partners and payment gateways.</p>

        <h3 className="mt-4 font-display text-xl">Security Precautions</h3>
        <p>
          To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server. However, the transmission of information is not completely secure for reasons beyond our control. By using the Platform, the users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure, and therefore, there would always remain certain inherent risks regarding use of the Platform. Users are responsible for ensuring the protection of login and password records for their account.
        </p>

        <h3 className="mt-4 font-display text-xl">Data Deletion and Retention</h3>
        <p>
          You have an option to delete your account by visiting your profile and settings on our Platform, this action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests. We may in event of any pending grievance, claims, pending shipments or any other services we may refuse or delay deletion of the account. Once the account is deleted, you will lose access to the account. We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes. We may continue to retain your data in anonymised form for analytical and research purposes.
        </p>

        <h3 className="mt-4 font-display text-xl">Your Rights</h3>
        <p>You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.</p>

        <h3 className="mt-4 font-display text-xl">Consent</h3>
        <p>
          By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy. If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy. You, while providing your personal data over the Platform or any partner platforms or establishments, consent to us (including our other corporate entities, affiliates, lending partners, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or e-mail for the purposes specified in this Privacy Policy. You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention "Withdrawal of consent for processing personal data" in your subject line of your communication. We may verify such requests before acting on our request. However, please note that your withdrawal of consent will not be retrospective and will be in accordance with the Terms of Use, this Privacy Policy, and applicable laws. In the event you withdraw consent given to us under this Privacy Policy, we reserve the right to restrict or deny the provision of our services for which we consider such information to be necessary.
        </p>

        <h3 className="mt-4 font-display text-xl">Changes to this Privacy Policy</h3>
        <p>
          Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert / notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.
        </p>
      </Section>
    </div>
  );
}
