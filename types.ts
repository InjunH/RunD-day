
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

  // Extended fields for detail modal
  organizer?: string;              // 주최자
  registrationStart?: string;      // 등록 시작일 (ISO 8601)
  registrationEnd?: string;        // 등록 마감일
  registrationStatus?: string;     // "접수중", "마감 D-20", "마감", "등록전"
  price?: {
    currency: string;              // "KRW", "USD"
    amount: number;                // 40000
    description?: string;          // "얼리버드 할인"
  };
  imageUrl?: string;               // 대회 대표 이미지 URL
}

export interface FilterState {
  months: number[];
  regions: string[];
  distances: string[];
  countries: string[];
  searchQuery: string;
}
