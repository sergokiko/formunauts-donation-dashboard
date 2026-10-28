# Formunauts · Donation Dashboard

Angular 22 app for the Formunauts frontend assignment: campaign performance against its goals, the full
list of donation records (tens of thousands), and manual entry of a new donation. The REST backend is
mocked inside the browser, so nothing but Node is needed to run it.

## Setup instructions

Requirements: Node 20.19+ (built with Node 22) and npm.

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build      # production build into dist/
```

While reviewing:

- The campaign switcher in the header holds three seeded campaigns: one running, one ended, one just started.
- The **Mock API** panel (bottom-right corner) can make the next request fail, to show the error paths; every
  mocked call answers after a fixed 350 ms.
- The donor `mia.hofer@example.org` already exists in every campaign; entering it in the form shows the
  duplicate-donor answer from the "server".

## Main design considerations, decisions and trade-offs

**Architecture.** Three plain layers: `domain/` (records, enums, `CampaignPerformance`, money helpers, no
HTTP), `api/` (`CampaignApi` and `DonationApi`, the only code that talks `HttpClient`, with zod schemas as
the API contract and the mock backend beside them), and `view/` (components, plus the
page-scoped `DonationsStore`). Services are injected directly; Angular's injector is the test seam
(`{ provide: DonationApi, useValue: fake }`), so I deliberately did not add a port/adapter layer on top.

**Tens of thousands of donations.** Aggregates (totals, daily series, payment-method split) are computed by
the server and fetched once per campaign; the client never downloads the whole set to draw a chart. The list
uses keyset pagination (the cursor is the id of the last row delivered, so rows inserted while paging never
shift or repeat later pages), 50 rows per request, fetched when the virtual scroller (Angular CDK) is within
15 rows of the loaded end. Search and filters are server-side query parameters; search is debounced and every
filter change restarts at page one. A request id guards against out-of-order responses.

**State.** Read-only data (campaign list, overview, fundraisers) comes from Angular's `resource()`, keyed on
the route's campaign id. The donations list has a small signal store because it accumulates pages. After a
successful save the list and the overview simply reload, which is one round trip and always truthful; an
optimistic insert was tried and dropped as not worth its ordering rule.

**Form.** Signal Forms: the schema declares the rules (required fields, email, €1–€10,000, date not in the
future and inside the campaign), `submit()` runs them, and the server's duplicate-donor answer (409) is
mapped onto the email field. A failed request keeps the entries and shows a message; double submit is
blocked while saving. Expected business outcomes are returned as data (`created` | `duplicate_donor`);
transport failures are thrown as `AppError`.

**Mock backend.** An `HttpInterceptorFn` answers `/api/**` from an in-memory DB seeded by a fixed-seed PRNG
(3 campaigns, 30 fundraisers, about 20,000 donations with weekday patterns and log-normal amounts; dates are
relative to today so the demo never goes stale). Chosen over json-server/MSW so that `npm start` is the whole
setup and the API services stay real `HttpClient` code: to use a real backend, remove the interceptor from
`app.config.ts`.

**Charts.** D3 is used as a maths library (scales, arcs, line generators inside `computed()`); the SVG is
rendered by Angular templates, which keeps the charts declarative and resize-aware. Each chart has an
`aria-label` summary.

**Styling and accessibility.** Hand-written SCSS with tokens, mixins and flat camelCase class names (no
component library). Mobile and desktop breakpoints; the table becomes cards and the dialog a full-screen
sheet on phones. Native `<dialog>` for focus trapping, labelled controls with `aria-describedby` errors, a
keyboard-scrollable virtual list, live regions for toasts; checked with axe-core (0 violations).

**Edge cases handled.** Loading skeletons; inline errors with retry for the overview, first page and next
page (loaded rows are kept); unknown campaign and unknown route; empty list and "no matches" with a one-click
clear; no campaigns at all; a campaign that has not started disables entry; DST-safe calendar arithmetic in
the daily series.

**Trade-offs.** One currency (EUR) in the data model, since a campaign collects in one currency; failed requests are retried by the user through Retry buttons rather than automatically,
and the one-time fundraiser list has no retry of its own (if it fails, the fundraiser select in the form stays
empty until the page is reloaded); the UI was verified by hand and with axe-core rather
than with end-to-end tests, keeping the automated suite to the logic that can break silently. AI assistance
was used for the mock backend (seed data, in-memory DB and interceptor) and for the D3 chart components, to
make the dashboard look realistic and interactive .

## Chosen data model and testing strategy

### Data model

```ts
interface CampaignRecord {
  id: string;
  name: string;
  charityName: string;
  channel: 'street' | 'event' | 'door_to_door';
  startDate: string;
  endDate: string; // YYYY-MM-DD, inclusive
  currency: 'EUR';
  goalAmount: number; // amounts are integer minor units (cents)
  donorGoal: number;
}

interface CampaignOverviewRecord {
  // aggregated server-side
  campaign: CampaignRecord;
  raisedAmount: number;
  donationCount: number;
  uniqueDonors: number;
  monthlyDonorCount: number;
  averageAmount: number;
  daily: { date: string; amount: number; count: number }[];
  byPaymentMethod: { method: PaymentMethod; amount: number; count: number }[];
}

interface DonationRecord {
  // one donor sign-up
  id: string;
  campaignId: string;
  fundraiserId: string;
  donor: { firstName: string; lastName: string; email: string };
  amount: number;
  currency: 'EUR';
  frequency: 'one_time' | 'monthly';
  paymentMethod: 'sepa_direct_debit' | 'credit_card' | 'google_pay' | 'apple_pay' | 'bank_transfer';
  donatedAt: string; // ISO 8601
}

interface FundraiserRecord {
  id: string;
  firstName: string;
  lastName: string;
}
```

### Testing strategy

Vitest in jsdom (the Angular 22 default), specs next to the code, hand-written fakes provided in place of
the API services, no mocking library. Rather than chasing coverage, there are one or two tests for each part
where a bug would do the most damage and would not be obvious by looking at the screen:

| Spec                           | Tests                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `donations-store.spec.ts`      | Pages through a campaign with the cursor and stops at the end; ignores the response of a request superseded by a newer one |
| `add-donation-form.spec.ts`    | Sends the donation in cents with a normalised email and emits it; puts the duplicate-donor (409) answer on the email field |
| `campaign-performance.spec.ts` | Counts elapsed and remaining days; classifies pace by comparing money progress with time progress                          |

The store test drives the state logic through a fake API with controllable response order; the form test
drives the rendered component through the DOM. Rendering details (virtual scrolling, charts, layout) were
verified by hand and with axe-core.

## Time spent

| Activity                                       | In editor | Outside editor |
| ---------------------------------------------- | --------- | -------------- |
| Reading the brief, domain research, data model | 0.5h      | 0.5h           |
| Architecture and project setup                 | 2h        | 0.5h           |
| Mock backend and API layer                     | 1h        |                |
| Overview, KPIs and charts                      | 2h        |                |
| Donations list, pagination, filters            | 1h        |                |
| Add-donation form and dialog                   | 2h        |                |
| Tests, accessibility pass, README              | 1h        |                |
| **Total**                                      | 9.5h      | 1h             | 10.5h |
