import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AddDonationResult,
  DonationRecord,
  DonationsQuery,
  FundraiserRecord,
  NewDonation
} from '../domain/donation/types/donation-types';
import { Page } from '../domain/shared/page';
import { API_BASE_URL } from './api-base-url';
import { requestJson, toAppError } from './request-json';
import { DuplicateDonorErrorSchema } from './schemas/api-error-schema';
import { DonationPageSchema, DonationSchema, FundraiserListSchema } from './schemas/donation-schemas';

@Service()
export class DonationApi {
  private readonly http = inject(HttpClient);

  listDonations(campaignId: string, query: DonationsQuery): Promise<Page<DonationRecord>> {
    let params = new HttpParams().set('limit', query.limit).set('sort', query.sort);
    if (query.cursor !== null) {
      params = params.set('cursor', query.cursor);
    }
    if (query.search.trim() !== '') {
      params = params.set('search', query.search.trim());
    }
    if (query.paymentMethod !== '') {
      params = params.set('paymentMethod', query.paymentMethod);
    }
    return requestJson(
      this.http.get(`${API_BASE_URL}/campaigns/${campaignId}/donations`, { params }),
      DonationPageSchema
    );
  }

  listFundraisers(): Promise<FundraiserRecord[]> {
    return requestJson(this.http.get(`${API_BASE_URL}/fundraisers`), FundraiserListSchema);
  }

  async addDonation(campaignId: string, donation: NewDonation): Promise<AddDonationResult> {
    try {
      const body = await firstValueFrom(this.http.post(`${API_BASE_URL}/campaigns/${campaignId}/donations`, donation));
      return { status: 'created', donation: DonationSchema.parse(body) };
    } catch (error) {
      const duplicate = error instanceof HttpErrorResponse && error.status === 409;
      const parsed = duplicate ? DuplicateDonorErrorSchema.safeParse(error.error) : undefined;
      if (parsed?.success) {
        return { status: 'duplicate_donor', existing: parsed.data.existing };
      }
      throw toAppError(error);
    }
  }
}
