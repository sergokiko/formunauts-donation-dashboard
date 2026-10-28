export enum CampaignChannel {
  Street = 'street',
  Event = 'event',
  DoorToDoor = 'door_to_door'
}

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  [CampaignChannel.Street]: 'Street',
  [CampaignChannel.Event]: 'Event',
  [CampaignChannel.DoorToDoor]: 'Door to door'
};
