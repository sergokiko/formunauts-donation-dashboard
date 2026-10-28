import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Service } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { toIsoDate } from '../../core/dates';
import { CampaignRecord } from '../../domain/campaign/types/campaign-types';
import { PAYMENT_METHODS, PaymentMethod } from '../../domain/donation/enum/payment-method';
import { DonationSort } from '../../domain/donation/types/donation-types';
import { API_BASE_URL } from '../api-base-url';
import { ApiErrorBody } from '../schemas/api-error-schema';
import { NewDonationSchema } from '../schemas/donation-schemas';
import { InMemoryDb, UnknownCursorError } from './in-memory-db';
import { createSeedData } from './seed-data';

const SEED = 42;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const SORTS: readonly DonationSort[] = ['donatedAt:desc', 'donatedAt:asc', 'amount:desc', 'amount:asc'];

interface Route {
  method: 'GET' | 'POST';
  pattern: RegExp;
  handle: (request: HttpRequest<unknown>, params: string[]) => HttpResponse<unknown>;
}

/**
 * The REST contract, implemented in the browser. Handlers either return an
 * `HttpResponse` or throw an `HttpErrorResponse` carrying the standard error
 * envelope — exactly what a real backend would put on the wire.
 */
@Service()
export class MockApiServer {
  private readonly db = new InMemoryDb(createSeedData(SEED, new Date()));

  private readonly routes: Route[] = [
    { method: 'GET', pattern: /^\/campaigns$/, handle: () => ok(this.db.listCampaigns()) },
    { method: 'GET', pattern: /^\/fundraisers$/, handle: () => ok(this.db.listFundraisers()) },
    {
      method: 'GET',
      pattern: /^\/campaigns\/([^/]+)\/overview$/,
      handle: (_request, [campaignId]) => {
        const overview = this.db.getOverview(campaignId);
        if (!overview) {
          throw fail(404, { code: 'NOT_FOUND', message: `Campaign "${campaignId}" does not exist.` });
        }
        return ok(overview);
      }
    },
    {
      method: 'GET',
      pattern: /^\/campaigns\/([^/]+)\/donations$/,
      handle: (request, [campaignId]) => {
        this.requireCampaign(campaignId);
        const sort = request.params.get('sort') ?? 'donatedAt:desc';
        const paymentMethod = request.params.get('paymentMethod') ?? '';
        if (!SORTS.includes(sort as DonationSort)) {
          throw fail(400, { code: 'VALIDATION', message: `Unsupported sort "${sort}".`, field: 'sort' });
        }
        if (paymentMethod !== '' && !PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
          throw fail(400, {
            code: 'VALIDATION',
            message: `Unknown payment method "${paymentMethod}".`,
            field: 'paymentMethod'
          });
        }
        const limit = Math.min(
          Math.max(Number(request.params.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1),
          MAX_LIMIT
        );
        try {
          return ok(
            this.db.listDonations(campaignId, {
              cursor: request.params.get('cursor'),
              limit,
              sort: sort as DonationSort,
              search: request.params.get('search') ?? '',
              paymentMethod: paymentMethod as PaymentMethod | ''
            })
          );
        } catch (error) {
          if (error instanceof UnknownCursorError) {
            throw fail(400, { code: 'VALIDATION', message: error.message, field: 'cursor' });
          }
          throw error;
        }
      }
    },
    {
      method: 'POST',
      pattern: /^\/campaigns\/([^/]+)\/donations$/,
      handle: (request, [campaignId]) => {
        const campaign = this.requireCampaign(campaignId);
        const parsed = NewDonationSchema.safeParse(request.body);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw fail(400, { code: 'VALIDATION', message: issue.message, field: issue.path.join('.') });
        }
        if (!this.db.getFundraiser(parsed.data.fundraiserId)) {
          throw fail(400, { code: 'VALIDATION', message: 'Unknown fundraiser.', field: 'fundraiserId' });
        }
        const donatedAt = new Date(parsed.data.donatedAt);
        if (donatedAt.getTime() > Date.now()) {
          throw fail(400, {
            code: 'VALIDATION',
            message: 'The donation date cannot be in the future.',
            field: 'donatedAt'
          });
        }
        const donatedDay = toIsoDate(donatedAt);
        if (donatedDay < campaign.startDate || donatedDay > campaign.endDate) {
          throw fail(400, {
            code: 'VALIDATION',
            message: `The donation date must fall within the campaign (${campaign.startDate} – ${campaign.endDate}).`,
            field: 'donatedAt'
          });
        }
        const existing = this.db.findDonationByEmail(campaignId, parsed.data.donor.email);
        if (existing) {
          throw fail(409, {
            code: 'DUPLICATE_DONOR',
            message: 'This donor has already signed up for this campaign.',
            field: 'donor.email',
            existing
          });
        }
        return new HttpResponse({ status: 201, body: this.db.addDonation(campaignId, parsed.data) });
      }
    }
  ];

  handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const path = request.url.slice(API_BASE_URL.length);
    for (const route of this.routes) {
      const match = route.method === request.method ? path.match(route.pattern) : null;
      if (match) {
        try {
          return of(route.handle(request, match.slice(1)));
        } catch (error) {
          return throwError(() => error);
        }
      }
    }
    return throwError(() => fail(404, { code: 'NOT_FOUND', message: `No route for ${request.method} ${path}` }));
  }

  private requireCampaign(campaignId: string): CampaignRecord {
    const campaign = this.db.getCampaign(campaignId);
    if (!campaign) {
      throw fail(404, { code: 'NOT_FOUND', message: `Campaign "${campaignId}" does not exist.` });
    }
    return campaign;
  }
}

function ok(body: unknown): HttpResponse<unknown> {
  return new HttpResponse({ status: 200, body });
}

function fail(status: number, body: ApiErrorBody & Record<string, unknown>): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body, statusText: body.code });
}
