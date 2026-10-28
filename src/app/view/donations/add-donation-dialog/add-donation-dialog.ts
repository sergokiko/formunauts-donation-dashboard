import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { CampaignRecord } from '../../../domain/campaign/types/campaign-types';
import { DonationRecord, FundraiserRecord } from '../../../domain/donation/types/donation-types';
import { AddDonationForm } from '../add-donation-form/add-donation-form';

@Component({
  selector: 'app-add-donation-dialog',
  imports: [AddDonationForm],
  templateUrl: './add-donation-dialog.html',
  styleUrl: './add-donation-dialog.scss'
})
export class AddDonationDialog {
  readonly campaign = input.required<CampaignRecord | null>();
  readonly fundraisers = input.required<FundraiserRecord[]>();
  readonly created = output<DonationRecord>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly isOpen = signal(false);

  open() {
    this.isOpen.set(true);
    this.dialogRef().nativeElement.showModal();
  }

  close() {
    this.dialogRef().nativeElement.close();
  }

  onClose() {
    this.isOpen.set(false);
  }

  onCreated(donation: DonationRecord) {
    this.created.emit(donation);
    this.close();
  }
}
