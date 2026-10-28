import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignRecord } from '../../../domain/campaign/types/campaign-types';

/** Top band: brand, optional campaign switcher, and projected actions (e.g. "Add donation"). */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss'
})
export class AppHeader {
  readonly campaigns = input<CampaignRecord[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly campaignChange = output<string>();

  onSelect(event: Event) {
    this.campaignChange.emit((event.target as HTMLSelectElement).value);
  }
}
