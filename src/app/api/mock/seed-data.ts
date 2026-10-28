import { addDays, atTime, toIsoDate } from '../../core/dates';
import { SeededRandom } from '../../core/utils/seeded-random';
import { CampaignChannel } from '../../domain/campaign/enum/campaign-channel';
import { CampaignRecord } from '../../domain/campaign/types/campaign-types';
import { DonationFrequency } from '../../domain/donation/enum/donation-frequency';
import { PaymentMethod } from '../../domain/donation/enum/payment-method';
import { DonationRecord, FundraiserRecord } from '../../domain/donation/types/donation-types';

export interface SeedData {
  campaigns: CampaignRecord[];
  fundraisers: FundraiserRecord[];
  donations: DonationRecord[];
}

/** A donor that exists in every campaign, so reviewers can trigger the duplicate check. */
export const DEMO_DONOR = { firstName: 'Mia', lastName: 'Hofer', email: 'mia.hofer@example.org' };

const FIRST_NAMES = [
  'Anna',
  'Lukas',
  'Sophie',
  'David',
  'Lena',
  'Felix',
  'Laura',
  'Jonas',
  'Emma',
  'Paul',
  'Marie',
  'Elias',
  'Julia',
  'Noah',
  'Sara',
  'Leon',
  'Hannah',
  'Tobias',
  'Lisa',
  'Maximilian',
  'Nina',
  'Florian',
  'Katharina',
  'Simon',
  'Valentina',
  'Moritz',
  'Clara',
  'Jakob',
  'Theresa',
  'Niklas'
];
const LAST_NAMES = [
  'Gruber',
  'Huber',
  'Bauer',
  'Wagner',
  'Müller',
  'Pichler',
  'Steiner',
  'Moser',
  'Mayer',
  'Hofer',
  'Leitner',
  'Berger',
  'Fuchs',
  'Eder',
  'Fischer',
  'Schmid',
  'Winkler',
  'Weber',
  'Schwarz',
  'Maier',
  'Reiter',
  'Lang',
  'Baumgartner',
  'Auer',
  'Binder',
  'Lechner',
  'Wolf',
  'Wallner',
  'Aigner',
  'Ebner',
  'Koller',
  'Lehner',
  'Haas',
  'Schuster',
  'Brunner',
  'Egger',
  'Holzer',
  'Novak',
  'Kaiser',
  'Wimmer'
];
const FUNDRAISER_NAMES: ReadonlyArray<[string, string]> = [
  ['Aisha', 'Rahman'],
  ['Ben', 'Okafor'],
  ['Carla', 'Esposito'],
  ['Daniel', 'Kowalski'],
  ['Eva', 'Lindqvist'],
  ['Farid', 'Haddad'],
  ['Greta', 'Nilsson'],
  ['Hugo', 'Marchand'],
  ['Ines', 'Carvalho'],
  ['Jana', 'Dvořák'],
  ['Kofi', 'Mensah'],
  ['Lea', 'Steinbach'],
  ['Mateo', 'Rossi'],
  ['Nadia', 'Petrova'],
  ['Omar', 'Said'],
  ['Petra', 'Horvat'],
  ['Quentin', 'Dubois'],
  ['Rosa', 'Alvarez'],
  ['Samir', 'Khan'],
  ['Tara', 'Brennan'],
  ['Umut', 'Yilmaz'],
  ['Vera', 'Kuznetsova'],
  ['Wiktor', 'Nowak'],
  ['Xenia', 'Papadopoulou'],
  ['Yusuf', 'Demir'],
  ['Zoe', 'Fontaine'],
  ['Adrian', 'Popescu'],
  ['Bianca', 'Ferrari'],
  ['Cyril', 'Lefèvre'],
  ['Dilara', 'Aydin']
];

const PAYMENT_MIX: ReadonlyArray<readonly [PaymentMethod, number]> = [
  [PaymentMethod.SepaDirectDebit, 55],
  [PaymentMethod.CreditCard, 25],
  [PaymentMethod.GooglePay, 8],
  [PaymentMethod.ApplePay, 8],
  [PaymentMethod.BankTransfer, 4]
];
/** Sunday .. Saturday */
const WEEKDAY_ACTIVITY = [0.3, 1, 1, 1, 1, 1, 0.7];
const MONTHLY_SHARE = 0.65;

interface CampaignBlueprint {
  campaign: Omit<CampaignRecord, 'startDate' | 'endDate'>;
  /** Offsets from today, in days. */
  startsIn: number;
  endsIn: number;
  donationsPerDay: number;
}

/** Three campaigns in different phases, dated relative to `today` so the demo never goes stale. */
function blueprints(): CampaignBlueprint[] {
  return [
    {
      campaign: {
        id: 'cmp_ocean',
        name: 'Ocean Guardians Autumn Drive',
        charityName: 'Blue Planet Trust',
        channel: CampaignChannel.Street,
        currency: 'EUR',
        goalAmount: 600_000_00,
        donorGoal: 20_000
      },
      startsIn: -45,
      endsIn: 44,
      donationsPerDay: 280
    },
    {
      campaign: {
        id: 'cmp_homes',
        name: 'Warm Homes Winter Appeal',
        charityName: 'Shelter Austria',
        channel: CampaignChannel.DoorToDoor,
        currency: 'EUR',
        goalAmount: 300_000_00,
        donorGoal: 8_000
      },
      startsIn: -80,
      endsIn: -21,
      donationsPerDay: 150
    },
    {
      campaign: {
        id: 'cmp_festival',
        name: 'Festival Season Sign-ups',
        charityName: 'Children First',
        channel: CampaignChannel.Event,
        currency: 'EUR',
        goalAmount: 400_000_00,
        donorGoal: 15_000
      },
      startsIn: -5,
      endsIn: 54,
      donationsPerDay: 500
    }
  ];
}

export function createSeedData(seed: number, today: Date): SeedData {
  const random = new SeededRandom(seed);
  const dayAt = (offset: number) => addDays(today, offset);

  const fundraisers: FundraiserRecord[] = FUNDRAISER_NAMES.map(([firstName, lastName], index) => ({
    id: `fr_${String(index + 1).padStart(2, '0')}`,
    firstName,
    lastName
  }));

  const campaigns: CampaignRecord[] = [];
  const donations: DonationRecord[] = [];
  let sequence = 0;

  for (const blueprint of blueprints()) {
    const campaign: CampaignRecord = {
      ...blueprint.campaign,
      startDate: toIsoDate(dayAt(blueprint.startsIn)),
      endDate: toIsoDate(dayAt(blueprint.endsIn))
    };
    campaigns.push(campaign);

    const team = Array.from({ length: 12 }, () => random.pick(fundraisers));
    const lastElapsedDay = Math.min(blueprint.endsIn, 0);

    const add = (donor: DonationRecord['donor'], donatedAt: Date) => {
      sequence += 1;
      const frequency = random.chance(MONTHLY_SHARE) ? DonationFrequency.Monthly : DonationFrequency.OneTime;
      donations.push({
        id: `don_${sequence.toString(36).padStart(5, '0')}`,
        campaignId: campaign.id,
        fundraiserId: random.pick(team).id,
        donor,
        amount: donationAmount(random, frequency),
        currency: campaign.currency,
        frequency,
        paymentMethod: random.weighted(PAYMENT_MIX),
        donatedAt: donatedAt.toISOString()
      });
    };

    add(DEMO_DONOR, atTime(dayAt(blueprint.startsIn), 10, 15));

    // Every seeded donor signs up once per campaign — the same rule the POST endpoint enforces.
    // Fundraisers work 09:00–18:59; today's sign-ups stop at the current time so nothing is dated in the future.
    for (let offset = blueprint.startsIn; offset <= lastElapsedDay; offset += 1) {
      const day = dayAt(offset);
      const firstMinute = 9 * 60;
      const lastMinute = offset === 0 ? today.getHours() * 60 + today.getMinutes() : 18 * 60 + 59;
      if (lastMinute <= firstMinute) {
        continue;
      }
      const activity = WEEKDAY_ACTIVITY[day.getDay()] * (0.8 + random.next() * 0.4);
      const dayShare = (lastMinute - firstMinute) / (18 * 60 + 59 - firstMinute);
      const count = Math.round(blueprint.donationsPerDay * activity * dayShare);
      for (let i = 0; i < count; i += 1) {
        const minute = random.int(firstMinute, lastMinute - 1);
        add(newDonor(random, sequence + 1), atTime(day, Math.floor(minute / 60), minute % 60));
      }
    }
  }

  return { campaigns, fundraisers, donations };
}

function newDonor(random: SeededRandom, suffix: number): DonationRecord['donor'] {
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const handle = `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return { firstName, lastName, email: `${handle}.${suffix}@example.org` };
}

/** Log-normal amounts in whole euros: monthly gifts cluster around €15, one-time gifts around €40. */
function donationAmount(random: SeededRandom, frequency: DonationFrequency): number {
  const [median, spread] = frequency === DonationFrequency.Monthly ? [15, 0.5] : [40, 0.7];
  const euros = Math.round(Math.exp(Math.log(median) + spread * random.normal()));
  return Math.min(Math.max(euros, 5), 500) * 100;
}
