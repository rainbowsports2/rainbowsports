import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Rainbow Sports" },
      { name: "description", content: "Terms and conditions for using Rainbow Sports." },
      { property: "og:title", content: "Terms & Conditions — Rainbow Sports" },
      { property: "og:description", content: "Terms and conditions for using Rainbow Sports." },
    ],
  }),
  component: Terms,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-2xl text-primary">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-5xl">TERMS &amp; CONDITIONS</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Please read these terms carefully before using our services.
      </p>

      <Section title="Product Information">
        <ul className="list-disc space-y-1 pl-6">
          <li>Slight color variations may occur due to lighting and screen brightness.</li>
        </ul>
      </Section>

      <Section title="Orders">
        <ul className="list-disc space-y-1 pl-6">
          <li>Orders may be cancelled if items are out of stock or due to verification issues.</li>
          <li>In such cases, a refund or store credit will be provided.</li>
        </ul>
      </Section>

      <Section title="Cash on Delivery">
        <ul className="list-disc space-y-1 pl-6">
          <li>COD is available for select pin codes.</li>
          <li>Repeated fake COD orders may result in COD being disabled.</li>
        </ul>
      </Section>

      <Section title="Pricing & Offers">
        <ul className="list-disc space-y-1 pl-6">
          <li>Prices and offers can change without prior notice.</li>
        </ul>
      </Section>

      <Section title="Disputes">
        <ul className="list-disc space-y-1 pl-6">
          <li>In case of disputes, the decision of our management will be final.</li>
        </ul>
      </Section>

      <Section title="General Terms of Use">
        <p>
          To access and use the Services, you agree to provide true, accurate and complete information to us during and after registration, and you shall be responsible for all acts done through the use of your registered account on the Platform.
        </p>
        <p>
          Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
        </p>
        <p>
          Your use of our Services and the Platform is solely and entirely at your own risk and discretion for which we shall not be liable to you in any manner. You are required to independently assess and ensure that the Services meet your requirements.
        </p>
        <p>
          The contents of the Platform and the Services are proprietary to us and are licensed to us. You will not have any authority to claim any intellectual property rights, title, or interest in its contents. The contents includes and is not limited to the design, layout, look and graphics.
        </p>
        <p>
          You acknowledge that unauthorized use of the Platform and/or the Services may lead to action against you as per these Terms of Use and/or applicable laws.
        </p>
        <p>You agree to pay us the charges associated with availing the Services.</p>
        <p>
          You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms, or Indian or local laws that might apply to you.
        </p>
        <p>
          You agree and acknowledge that website and the Services may contain links to other third party websites. On accessing these links, you will be governed by the terms of use, privacy policy and such other policies of such third party websites. These links are provided for your convenience to provide further information.
        </p>
        <p>
          You shall indemnify and hold harmless Platform Owner, its affiliates, group companies (as applicable) and their respective officers, directors, agents, and employees, from any claim or demand, or actions including reasonable attorney's fees, made by any third party or penalty imposed due to or arising out of Your breach of this Terms of Use, privacy Policy and other Policies, or Your violation of any law, rules or regulations or the rights (including infringement of intellectual property rights) of a third party.
        </p>
        <p>
          Notwithstanding anything contained in these Terms of Use, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.
        </p>
      </Section>

      <Section title="Governing Law & Jurisdiction">
        <p>
          These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed in accordance with the laws of India.
        </p>
        <p>
          All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in India.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.
        </p>
        <p>
          This website is operated by <strong>JYOTI PARCHURE</strong>.
        </p>
      </Section>
    </div>
  );
}
