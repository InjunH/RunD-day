
import { MarathonEvent } from './types';

export const MARATHON_DATA: MarathonEvent[] = [
  { id: '1', name: '2026 새해 일출런', date: '2026-01-01', region: '서울', locationDetail: '한강공원', distances: ['10km', '5km'], registrationUrl: 'https://runningwikii.com', tags: ['새해', '일출'] },
  { id: '2', name: '전마협 새해 맞이 마라톤', date: '2026-01-04', region: '충남', locationDetail: '예산군', distances: ['풀', '하프', '10km', '5km'], registrationUrl: 'http://www.marathon.pe.kr', tags: ['전마협'] },
  { id: '798', name: '2026 코리아 스노우 트레일', date: '2026-01-18', region: '강원', locationDetail: '태백 소원지 오토캠핑장', distances: ['30k', '13k'], registrationUrl: 'https://gorunning.kr/races/798/', tags: ['트레일', '동계'], notes: '주최: 태백시, 태백시 철인3종 협회' },
  { id: '732', name: '2026 전마협 제주 4Full 마라톤', date: '2026-01-23', region: '제주', locationDetail: '제주종합경기장', distances: ['풀'], registrationUrl: 'https://gorunning.kr/races/732/', tags: ['전마협'], notes: '주최: 전국마라톤협회' },
  { id: '875', name: '2026 똥바람 알통구보대회', date: '2026-01-24', region: '강원', locationDetail: '철원 승일공원', distances: ['6.32km'], registrationUrl: 'https://gorunning.kr/races/875/', tags: ['등록중'], notes: '주최: (재)철원문화재단' },
  { id: '756', name: '2026 전마협 제주 10km 마라톤', date: '2026-01-25', region: '제주', locationDetail: '제주 서귀포시', distances: ['10km'], registrationUrl: 'https://gorunning.kr/races/756/', tags: ['전마협'], notes: '주최: 전국마라톤협회' },
  { id: '762', name: '제2회 한강 서울 하프 마라톤', date: '2026-01-25', region: '서울', locationDetail: '상암 월드컵공원 평화광장', distances: ['하프', '10km', '5km'], registrationUrl: 'https://gorunning.kr/races/762/', tags: ['인기대회', '한강', '등록중'], isPopular: true, notes: '주최: 사단법인 국민성공시대' },
  { id: '844', name: '2026 화성 궁평항 동계 훈련 마라톤', date: '2026-01-31', region: '경기', locationDetail: '화성시 궁평항', distances: ['32km', '하프', '10km'], registrationUrl: 'https://gorunning.kr/races/844/', tags: ['동계훈련', '등록중'], notes: '주최: 기호일보' },
  { id: '808', name: '2026 인사이더런 W(2일간)', date: '2026-01-31', region: '경기', locationDetail: '킨텍스 제1전시관', distances: ['10km'], registrationUrl: 'https://gorunning.kr/races/808/', tags: ['등록중'], notes: '주최: 러너블' },
  { id: '5', name: '희망드림 제23회 동계 국제 마라톤', date: '2026-02-21', region: '서울', locationDetail: '한강', distances: ['32km', '하프', '10km', '5km'], registrationUrl: '', tags: ['동계'] },
  { id: '6', name: '2026 대구마라톤', date: '2026-02-22', region: '대구', locationDetail: '대구 시내 일원', distances: ['풀', '10km', '5km'], registrationUrl: 'https://daegumarathon.daegu.go.kr', tags: ['IAAF 공인', '메이저'], isPopular: true },
  { id: '7', name: '경기수원국제하프마라톤', date: '2026-02-22', region: '경기', locationDetail: '수원 종합운동장', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['국제대회'] },
  { id: '8', name: '제22회 밀양아리랑마라톤', date: '2026-02-22', region: '경남', locationDetail: '밀양 종합운동장', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['아리랑'] },
  { id: '9', name: '머니투데이방송 삼일절 마라톤', date: '2026-03-01', region: '서울', locationDetail: '상암 월드컵공원', distances: ['풀', '하프', '10km', '5km'], registrationUrl: '', tags: ['삼일절'] },
  { id: '10', name: '2026 고양특례시 하프마라톤', date: '2026-03-08', region: '경기', locationDetail: '고양시 일원', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['특례시'] },
  { id: '11', name: '2026 서울마라톤 (동아마라톤)', date: '2026-03-15', region: '서울', locationDetail: '광화문 → 잠실', distances: ['풀', '10km'], registrationUrl: 'https://seoul-marathon.com', tags: ['최대규모', '메이저', '광클'], isPopular: true },
  { id: '12', name: '서울 K-마라톤대회', date: '2026-03-22', region: '서울', locationDetail: '한강', distances: ['하프', '10km'], registrationUrl: '', tags: ['K-마라톤'] },
  { id: '13', name: '제26회 인천국제하프마라톤', date: '2026-03-22', region: '인천', locationDetail: '문학경기장', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['인천국제'] },
  { id: '14', name: '제25회 합천벚꽃마라톤', date: '2026-03-29', region: '경남', locationDetail: '합천군', distances: ['풀', '하프', '10km', '5km'], registrationUrl: '', tags: ['벚꽃시즌', '꽃길'] },
  { id: '15', name: '제33회 경주벚꽃마라톤', date: '2026-04-04', region: '경북', locationDetail: '경주 보문단지', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['벚꽃시즌', '경주여행'], isPopular: true },
  { id: '16', name: '군산 새만금마라톤', date: '2026-04-05', region: '전북', locationDetail: '군산 비응항', distances: ['풀', '10km', '5km'], registrationUrl: '', tags: ['새만금'] },
  { id: '17', name: '제27회 이천 도자기 마라톤', date: '2026-04-05', region: '경기', locationDetail: '이천시', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['도자기'] },
  { id: '18', name: '제8회 오션뷰 기장바다마라톤', date: '2026-04-19', region: '부산', locationDetail: '기장군', distances: ['하프', '10km', '3km'], registrationUrl: '', tags: ['바다뷰', '오션뷰'] },
  { id: '19', name: '제30회 삼척 황영조 국제 마라톤', date: '2026-04-25', region: '강원', locationDetail: '삼척시', distances: ['풀', '하프', '10km', '5km'], registrationUrl: '', tags: ['황영조'] },
  { id: '20', name: '2026 서울하프마라톤', date: '2026-04-26', region: '서울', locationDetail: '광화문 → 상암', distances: ['하프', '10km'], registrationUrl: 'https://chosunrun.com', tags: ['인기대회', '도심코스'], isPopular: true },
  { id: '21', name: '제24회 서울워킹페스티벌', date: '2026-05-09', region: '서울', locationDetail: '상암', distances: ['25km', '10km', '9km', '5km'], registrationUrl: '', tags: ['걷기대회'] },
  { id: '22', name: '소아암환우돕기 서울시민마라톤', date: '2026-05-10', region: '서울', locationDetail: '여의도 한강공원', distances: ['하프', '10km', '5km', '3km'], registrationUrl: '', tags: ['기부런', '착한마라톤'] },
  { id: '23', name: '제4회 서울한강 울트라마라톤', date: '2026-05-16', region: '서울', locationDetail: '강서구 방화동', distances: ['100km', '50km'], registrationUrl: '', tags: ['울트라', '한계도전'] },
  { id: '24', name: '제37회 지리산 화대종주', date: '2026-05-24', region: '전남', locationDetail: '지리산 일대', distances: ['48km', '40km', '34km', '21km'], registrationUrl: '', tags: ['트레일', '산악'] },
  { id: '25', name: '금산월드런마라톤', date: '2026-05-31', region: '충남', locationDetail: '금산군', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['인삼'] },
  { id: '26', name: '희망드림 새벽강변 국제마라톤', date: '2026-06-07', region: '서울', locationDetail: '상암 월드컵공원', distances: ['하프', '10km', '5km', '3km'], registrationUrl: '', tags: ['새벽대회'] },
  { id: '27', name: '제22회 설악국제트레킹페스티벌', date: '2026-06-13', region: '강원', locationDetail: '속초시 설악산', distances: ['20km', '10km', '5km'], registrationUrl: '', tags: ['트레킹'] },
  { id: '28', name: '제22회 영덕 해변 전국마라톤', date: '2026-06-14', region: '경북', locationDetail: '영덕군 해변', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['해변코스'] },
  { id: '29', name: '울진 금강송배 전국마라톤', date: '2026-09-13', region: '경북', locationDetail: '울진군', distances: ['하프', '10km', '5km'], registrationUrl: '', tags: ['가을시즌'] },
  { id: '30', name: '아라뱃길 나이트워크', date: '2026-09-19', region: '인천', locationDetail: '경인아라뱃길', distances: ['66km', '30km', '20km', '5km'], registrationUrl: '', tags: ['야간걷기', '나이트워크'] },
  { id: '31', name: '천안삼거리 흥타령울트라마라톤', date: '2026-10-10', region: '충남', locationDetail: '천안시', distances: ['100km', '60km'], registrationUrl: '', tags: ['울트라'] },
  { id: '32', name: '청원생명쌀대청호마라톤', date: '2026-10-17', region: '충북', locationDetail: '청주시 대청호', distances: ['풀', '하프', '10km', '5km'], registrationUrl: '', tags: ['대청호'] },
  { id: '33', name: '한국국제걷기대회', date: '2026-10-24', region: '서울', locationDetail: '잠실', distances: ['42km', '25km', '10km', '5km'], registrationUrl: '', tags: ['걷기대회'] },
  { id: '34', name: '2026 JTBC 마라톤', date: '2026-11-01', region: '서울', locationDetail: '상암 → 잠실', distances: ['풀', '10km'], registrationUrl: 'https://jtbcmarathon.joins.com', tags: ['인기대회', '메이저', '가을의전설'], isPopular: true },
];

export const REGIONS = ['서울', '경기', '인천', '충남', '충북', '대전', '경북', '경남', '대구', '부산', '울산', '전북', '전남', '광주', '강원', '제주'];
export const DISTANCES = ['풀', '하프', '10km', '5km', '울트라', '기타'];
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
