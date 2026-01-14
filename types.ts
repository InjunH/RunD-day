
export type DistanceType = '풀' | '32km' | '25km' | '하프' | '10km' | '5km' | '3km' | '100km' | '50km' | '48km' | '40km' | '34km' | '21km' | '20km' | '9km' | '66km' | '30km';

export interface MarathonEvent {
  id: string;
  name: string;
  date: string;
  region: string;
  locationDetail: string;
  distances: string[];
  registrationUrl: string;
  tags: string[];
  isPopular?: boolean;
  notes?: string;
}

export interface FilterState {
  months: number[];
  regions: string[];
  distances: string[];
  searchQuery: string;
}
