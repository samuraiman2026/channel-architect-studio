import type { ScenarioId, SectionKey } from "./types";

type MockMap = Record<ScenarioId, Record<SectionKey, string>>;

const s1: Record<SectionKey, string> = {
  "exec-summary": `The program prioritizes **Influence** partners — primarily systems integrators and tier-2 consultancies serving mid-market engineering teams — over a traditional reseller motion. At $20M ARR with a PLG core motion, the company lacks the deal-size headroom to fund competitive resell discounts, but the enterprise expansion thesis depends on partners who can speak to platform-engineering buyers the direct team doesn't reach. The program runs two tiers (Select and Premier), targets 20% partner-influenced revenue by month 12, and accepts a tradeoff: slower top-of-funnel partner-sourced volume in year one, in exchange for higher-quality enterprise deals. Success means partner-influenced ACV running 2x direct-AE ACV by month 12; failure looks like SIs disengaging because comp neutrality wasn't enforced.`,
  "strategic-rationale": `- The bottleneck is **enterprise credibility**, not pipeline volume. SI co-sell adds the technical-trust layer that direct AEs cannot manufacture in a single cycle.
- Resell is wrong at this stage: discounts would dilute already-thin gross margins, and SIs at this tier prefer influence comp over carrying inventory risk.
- **ISV build-on** is a long-tail bet — fund the developer surface, but do not stage-gate the program on it. Expect 18 months to material ISV-sourced revenue.
- Referral remains open as a low-cost channel for early-stage prospects funneled in via design partners and angel networks.
- The decisive design choice is **comp neutrality with the direct team** on influence deals. Without it, AEs will route partners out of deals and the program will quietly die in quarter three.`,
  ipp: `## SI / Consulting (Primary)

The target SI is a 50-500 person regional or vertical-focused consultancy already implementing modern data infrastructure for mid-market clients. They have a platform-engineering practice, are not exclusive to a hyperscaler, and bill on a time-and-materials or fixed-scope basis. The wrong SI is a Big Four global — too slow to recruit, too expensive to enable, and their partners route revenue to higher-tier vendors.

| Attribute | Target |
|---|---|
| Headcount | 50-500 |
| Geography | NA + EMEA, single-region focus acceptable |
| Practice | Data / platform engineering |
| Existing stack | At least one hyperscaler partnership, no exclusivity |
| Deal influence | $100K-$1M typical engagement |

## ISV (Primary)

The target ISV is a developer-platform or data-tooling vendor with overlapping ICP and a complementary surface area — observability, orchestration, vector databases, model-routing layers. They have an existing technology-partner program and value integration depth over logo trade.

| Attribute | Target |
|---|---|
| Stage | Series A-C |
| Surface | Adjacent, non-overlapping |
| Integration appetite | Active engineering ownership, not BD-only |
| Marketing reach | Owned developer audience, 10K+ active users |`,
  tiering: `| Tier | Entry Requirements | Investment from Vendor | Partner Commitment |
|---|---|---|---|
| **Select** | Signed MSA, 1 certified architect, 2 deals registered/year | Self-serve enablement, partner portal, deal reg | Joint marketing optional |
| **Premier** | 3+ certified architects, $500K influenced ARR, named partner manager | Dedicated PSE 0.25 FTE, MDF up to $25K/yr, exec sponsor | Joint GTM plan, quarterly business review |

Two tiers is deliberate. At $20M ARR the program cannot afford to support more than ~30 Premier partners with real attention, and a third tier creates illusory progression without proportional vendor capacity. Select is intentionally low-friction so the long tail of curious SIs can transact without consuming partner-manager cycles; Premier is where the program puts its weight, with hard quantitative gates that prevent badge inflation.`,
  economics: `**Margin philosophy.** Influence-led: vendor retains full list margin, partner is compensated for sourced or influenced revenue via a flat-rate fee structure, not a discount-off-list resell margin.

**Resell margin.** Not offered at this stage. Revisit at $50M ARR when deal sizes and gross margin support it.

**Referral fee.** 10% of year-one ACV on closed-won deals where partner is sole-sourced, paid net-30 from invoice collection. Capped at $50K per deal.

**Influence fee.** 5% of year-one ACV on deals where partner is materially involved in technical validation or implementation scoping. Documented via partner-flagged deal registration.

**MDF (Market Development Funds).** Premier tier only. Up to $25K/year per partner, 50% co-funded, tied to a written joint marketing plan with quantified pipeline targets.

**Co-sell incentive for the direct team.** Direct AEs receive 100% quota retirement on partner-influenced deals — no haircut, no split. This is the single most important line in the comp plan; without it the program will fail.`,
  motions: `## SI / Consulting

Co-sell with the direct AE on enterprise (>$100K) opportunities. Partner leads technical validation and implementation scoping; vendor leads commercial. Partner-manager facilitates introductions during the discovery and POC phases. No reseller workflow.

## ISV

Joint integration listed in both partners' marketplaces with a "better together" technical brief. Co-marketed via one annual joint webinar and a shared customer story. Lead-share is opt-in per opportunity, not blanket. Build-on partners get prioritized API roadmap input.`,
  enablement: `## Select tier
- Self-serve partner portal with product training (4 hours)
- Async certification: 1 sales, 1 technical (architect)
- Public Slack community channel
- Quarterly partner-wide office hours

## Premier tier
- All Select benefits, plus:
- Dedicated 0.25 FTE partner solutions engineer
- Private Slack channel with vendor PM and PMM access
- Quarterly joint roadmap review
- Annual in-person partner advisory board (8-12 partners)
- Early access to pre-GA features (under NDA)`,
  "launch-plan": `## Days 1-30: Foundation
- Finalize program documentation (partner agreement, deal reg policy, fee schedule)
- Stand up partner portal (off-the-shelf — PartnerStack or Allbound; do not build)
- Recruit 5 design-partner SIs from existing customer base (warm intros only)
- Lock comp-neutrality language with direct sales leadership; signed by VP Sales

## Days 31-60: Validation
- Onboard 5 design-partner SIs through Select tier
- Run 2 joint discovery calls with each design partner to validate motion
- Publish first joint solution brief
- Identify 2-3 ISV integration targets, begin technical conversations

## Days 61-100: Scale prep
- Open Select tier to public application
- Promote first 1-2 design partners to Premier (case study + quantified outcomes)
- Hire dedicated partner manager (one head, North America)
- First quarterly business review with Premier cohort`,
  risks: `- **Comp neutrality erosion.** Direct AEs will lobby for partial-credit splits within two quarters. Mitigation: written policy signed by VP Sales at launch; quarterly audit of partner-flagged deals.
- **Badge inflation.** Pressure to promote Select partners to Premier without hitting gates will be intense. Mitigation: gates are quantitative and reviewed by a non-partner-team finance partner.
- **SI capacity capture.** Top SIs will be courted by larger vendors with bigger fees. Mitigation: lead with technical depth and roadmap influence, not fee competition.
- **ISV time-to-revenue.** Build-on revenue lags 18+ months. Mitigation: do not stage-gate program success on ISV metrics in year one.
- **Partner manager hire.** A wrong first hire sets the program back two quarters. Mitigation: hire someone with operator experience at a stage-appropriate vendor, not a Big Four BD veteran.`,
};

const s2: Record<SectionKey, string> = {
  "exec-summary": `The program is built around two motions appropriate to a $5M ARR vertical AI vendor: a small **Referral** network that converts the founder's domain-specific advisor relationships into structured deal flow, and a focused **SI / Consulting** co-sell motion with regulated-industry boutiques. Resell is not offered. The single tier ("Founding Partner") reflects the company's stage — building tiering structure now would be theater. The program targets 25% partner-sourced pipeline by month 12 and explicitly accepts that its primary near-term value is **reducing founder hours per deal**, not headline revenue. Success looks like the founder spending 30% less time on early-stage discovery within two quarters.`,
  "strategic-rationale": `- At Series A, the program's job is to **free the founder**, not to build a scaled channel. Treat every program decision against that test.
- Regulated-industry buyers trust **named domain experts** more than vendor brand. Referral partners with credibility in legal or healthcare convert at 3-5x cold outbound.
- A single tier is correct. Tiering ceremony at this stage signals bureaucracy and slows partner activation.
- SI co-sell is high-leverage only with boutiques that already serve the target vertical — generalist SIs will not move the needle and will consume scarce attention.
- Do **not** stand up a formal ISV program yet. One or two opportunistic technology integrations is fine; a program is premature.`,
  ipp: `## SI / Consulting (Primary)

Vertical-specialist boutique consultancies — 10-100 person firms whose entire practice serves regulated-industry mid-market clients. They sell strategy and implementation, often around compliance, workflow redesign, or risk. They are not currently AI-native but their clients are asking about AI weekly.

| Attribute | Target |
|---|---|
| Headcount | 10-100 |
| Vertical | Legal, healthcare, financial services |
| Practice | Compliance, workflow, risk |
| AI maturity | Currently low, actively seeking a vendor partnership |

## Referral / Agency (Primary)

Individual operators and small advisory shops with deep buyer relationships in the target vertical: former CIOs, ex-GCs, healthcare ops consultants. Compensated on referral fees, not retainers.`,
  tiering: `| Tier | Entry Requirements | Investment from Vendor | Partner Commitment |
|---|---|---|---|
| **Founding Partner** | Signed referral or co-sell agreement, 1 named champion | Direct founder access, named contact, transparent roadmap | Make 2+ qualified introductions per quarter |

A single tier is the right answer at this stage. A two- or three-tier structure would require enablement infrastructure the company cannot yet staff, and would tell partners that vendor attention is rationed — exactly the wrong signal when the program's whole value proposition is high-touch founder access. Revisit tiering at $15M ARR when the program needs to ration attention rather than amplify it.`,
  economics: `**Margin philosophy.** Pure referral and influence. No resell, no discounts.

**Resell margin.** Not offered.

**Referral fee.** 15% of year-one ACV on sole-sourced deals, paid net-30 from collection. Higher than benchmark because individual referrers in regulated verticals have outsized leverage and few competing offers.

**Influence fee.** 7% of year-one ACV for SI partners who materially shape the technical solution.

**MDF.** None. At $5M ARR co-marketing is opportunistic, not budgeted.

**Co-sell incentive for the direct team.** Founder is the direct team; alignment is structural, not contractual. When the company hires its first AEs, install full quota credit for partner-influenced deals on day one.`,
  motions: `## SI / Consulting

Co-sell on opportunities the partner originates inside their existing client base. Vendor (founder) joins the second meeting, leads commercial. Partner owns relationship continuity post-sale and is the de-facto implementation lead, paid by their client.

## Referral / Agency

Warm-intro motion. Partner makes the introduction, vendor takes it from there. Lightweight CRM tagging, no formal handoff process. Quarterly check-in call with each active referrer.`,
  enablement: `## Founding Partner
- 60-minute founder-led product walkthrough
- One-page solution brief tailored to partner's vertical sub-segment
- Shared Notion with deal-reg form, pricing guidance, current case studies
- Direct Slack DM with founder
- Quarterly 30-minute "what's new" sync`,
  "launch-plan": `## Days 1-30: Foundation
- Draft simple one-page partner agreement (legal counsel review, not a 40-page MSA)
- Identify 8-10 candidate Founding Partners from founder's existing network
- Build referral tracking in CRM (custom field; do not buy software yet)

## Days 31-60: Activation
- Sign 5 Founding Partners
- Conduct first founder-led training session with each
- Publish two vertical-specific solution briefs (one legal, one healthcare)

## Days 61-100: Validation
- First partner-sourced deal closed-won (target)
- Document partner-sourced pipeline contribution
- Decide based on data: invest deeper in SI motion or referral motion, not both equally`,
  risks: `- **Founder bandwidth.** The program is founder-dependent by design; if the founder cannot protect 4 hours/week, the program will stall. Mitigation: calendar the time, treat it as a sales meeting.
- **Wrong partner profile.** A generalist SI will burn cycles and produce nothing. Mitigation: vertical fit is a hard gate at recruitment.
- **Referral fee perceived as small.** 15% on a $30K ACV deal is $4,500 — meaningful to an individual, marginal to a firm. Mitigation: target individuals, not firms, for referral.
- **Premature tiering pressure.** Partners will ask "what's the next level?" Mitigation: be honest that the next level is a year out and roadmap-driven.
- **Compliance / liability ambiguity.** In legal and healthcare, partners may carry liability exposure for vendor recommendations. Mitigation: explicit indemnification language in the partner agreement.`,
};

const s3: Record<SectionKey, string> = {
  "exec-summary": `The program is **build-on first, marketplace second, services third**. At $50M ARR with a developer-led core and a credible platform-sales motion forming, the company's defensive moat is the depth of its ISV ecosystem and the breadth of its marketplace presence. Resell is added as a small (~10%) component to support enterprise procurement workflows where customers prefer to buy through an existing vendor relationship. The program runs three tiers (Registered, Build, Strategic), targets 35% partner-influenced enterprise ACV by month 12, and treats SI / Consulting as a deliberate supporting motion — not the headline.`,
  "strategic-rationale": `- The product is a **platform**; the program must compound platform value, not just amplify sales coverage.
- Marketplace presence (AWS, Azure, GCP) is no longer optional at this ARR — it is the cost of competing for enterprise procurement.
- Build-on partners (ISVs building on the platform) generate the most durable moat because their roadmaps lock in mutual dependency.
- Resell is a small but necessary component (~10%) for enterprise customers whose procurement requires routing through an incumbent vendor — not a primary economic engine.
- SI / Consulting is a supporting motion, not a headline. Direct sales remains the lead on enterprise deals; SIs accelerate implementation and reduce time-to-value.`,
  ipp: `## ISV (Primary)

Developer-platform companies building product on top of the vendor's APIs. They are not just integrating — they are dependent. Target 30-50 strategic ISV partners over 18 months. Their success is the vendor's moat.

| Attribute | Target |
|---|---|
| Build depth | At least 3 surface integrations or platform-native architecture |
| Stage | Seed to Series C |
| Co-marketing appetite | High |

## Marketplace (Primary)

Three required listings: AWS Marketplace, Azure Marketplace, GCP Marketplace. Plus category-specific marketplaces (e.g., Snowflake Native Apps, Databricks Partner Connect) where the buyer overlap is high.`,
  tiering: `| Tier | Entry | Vendor Investment | Partner Commitment |
|---|---|---|---|
| **Registered** | Free, signed terms | Self-serve, public docs, community Slack | Listed integration |
| **Build** | $100K influenced ARR or 1K active joint users | Named PSE, co-marketing kit, quarterly review | Roadmap participation |
| **Strategic** | $1M influenced ARR, exec sponsor, joint roadmap | Dedicated PM access, co-sell with direct AEs, MDF up to $100K/yr | Joint GTM plan, named exec sponsor |

Three tiers is deliberate at this ARR. Below Build, partners are self-serve and the program cost is near-zero. The investment concentrates on the ~10-15 Strategic partners that materially move enterprise ACV. The Build tier exists to give promising mid-tier ISVs a clear progression target without paying for full Strategic infrastructure.`,
  economics: `**Margin philosophy.** Mixed: build-on and influence are the core economic engines, with a small resell component for procurement support.

**Resell margin.** 15% off list for accredited resellers on enterprise deals where customer procurement requires it. Cap on number of authorized resellers (target ~10 globally) to prevent channel conflict.

**Referral fee.** 8% of year-one ACV, capped at $100K per deal.

**Influence fee.** 4% of year-one ACV on partner-influenced enterprise deals.

**Build-on economics.** Revenue share on joint listings: 80% to ISV, 20% to platform vendor on customer transactions originating in the ISV's product. Reverse split (80/20 to platform vendor) on transactions originating in the platform's marketplace.

**MDF.** Strategic tier only, up to $100K/year, 50% match, written joint plan with pipeline targets.

**Co-sell incentive for the direct team.** Full quota retirement on partner-influenced deals plus a 2% accelerator on net-new enterprise logos sourced via Strategic partners.`,
  motions: `## ISV

Joint solution-building. Vendor PM partners with ISV PM on integration roadmap. Co-marketed via shared customer stories, joint webinars, conference co-presence. Lead-share opt-in. Strategic ISVs participate in vendor's annual roadmap planning.

## Marketplace

Listing-and-fulfillment motion. Vendor maintains listings, handles transaction infrastructure, monitors marketplace-specific incentive programs. Customer success owns post-purchase activation.`,
  enablement: `## Registered
- Public docs, sample code, community Slack
- Async self-serve certifications

## Build
- All Registered benefits, plus:
- Dedicated PSE for 0.5 FTE-equivalent across cohort
- Co-marketing kit and joint solution-brief template
- Quarterly partner-tier business review
- Beta access to pre-GA APIs

## Strategic
- All Build benefits, plus:
- Named PM and exec sponsor
- Joint roadmap input and pre-GA design partnership
- Dedicated MDF allocation
- Annual in-person Strategic partner summit
- Direct-AE co-sell pairing on enterprise opportunities`,
  "launch-plan": `## Days 1-30: Foundation
- Finalize all three marketplace listings (AWS, Azure, GCP) — production-ready
- Publish three-tier program documentation and partner portal
- Identify Build cohort (target 25 ISVs) from existing integration partners
- Lock direct-sales comp plan for partner-influenced deals

## Days 31-60: Build cohort activation
- Onboard initial Build cohort (target 15)
- Stand up dedicated PSE function
- Run first co-marketing campaign with 3 Build partners
- Begin Strategic tier conversations with top 5 ISVs

## Days 61-100: Strategic launch
- Promote first 3-5 partners into Strategic tier with full investment package
- Host inaugural Strategic partner advisory board
- Launch reseller program (small, invite-only) with first 3 authorized resellers
- Publish first quarterly partner-program metrics to internal leadership`,
  risks: `- **Marketplace tax dilution.** AWS/Azure/GCP marketplace fees compound; if more than 50% of revenue routes through marketplaces, gross margin erodes. Mitigation: model marketplace mix, price accordingly, prefer direct contracts for largest customers.
- **ISV roadmap drift.** Strategic ISVs may shift their integration to a competitor. Mitigation: depth of integration (not breadth) creates switching cost; invest in deep technical co-development on top 10.
- **Channel conflict from resell.** Even a small reseller cohort creates AE friction. Mitigation: hard ceiling on reseller count, named-account carve-outs documented in advance.
- **SI underservice.** Treating SI as a supporting motion may underweight a partner type that becomes strategic later. Mitigation: review SI motion contribution every two quarters.
- **Program overhead at scale.** Three tiers at $50M ARR risks bureaucracy. Mitigation: keep Registered fully self-serve; concentrate human cycles on Strategic.`,
};

export const MOCK_DATA: MockMap = {
  "ai-infra-b": s1,
  "vertical-ai-a": s2,
  "ai-devtools-c": s3,
};
