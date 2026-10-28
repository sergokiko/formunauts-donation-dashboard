import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CampaignOverviewRecord, CampaignRecord } from '../domain/campaign/types/campaign-types';
import { API_BASE_URL } from './api-base-url';
import { requestJson } from './request-json';
import { CampaignListSchema, CampaignOverviewSchema } from './schemas/campaign-schemas';

@Service()
export class CampaignApi {
  private readonly http = inject(HttpClient);

  listCampaigns(): Promise<CampaignRecord[]> {
    return requestJson(this.http.get(`${API_BASE_URL}/campaigns`), CampaignListSchema);
  }

  getCampaignOverview(campaignId: string): Promise<CampaignOverviewRecord> {
    return requestJson(this.http.get(`${API_BASE_URL}/campaigns/${campaignId}/overview`), CampaignOverviewSchema);
  }
}
