# 🏃 RunD-day

> **마라톤 대회 일정 알림 서비스**
> 대한민국 모든 마라톤 일정을 한 곳에서 - 광클 방지기와 함께 페이스를 조절하세요

[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [사용 방법](#-사용-방법)
- [프로젝트 구조](#-프로젝트-구조)
- [개발](#-개발)
- [기여하기](#-기여하기)

## 🎯 소개

**RunD-day**는 러너들을 위한 마라톤 대회 일정 통합 관리 서비스입니다.

### 문제점
- 마라톤 대회마다 접수 사이트가 달라 일정 관리가 어려움
- 선착순 마감으로 인한 광클 경쟁
- 지역/거리별 대회 정보를 찾기 어려움

### 해결책
RunD-day는 전국의 마라톤 대회 일정을 한 곳에 모아 제공하며, 필터링과 검색 기능으로 원하는 대회를 쉽게 찾을 수 있습니다.

## ✨ 주요 기능

### 🗓️ 대회 일정 관리
- **34개 2026년 마라톤 대회** 일정 수록
- **월별/지역별 필터링** - 원하는 시기와 지역의 대회만 선별
- **통합 검색** - 대회명, 지역, 태그로 빠른 검색

### ⭐ 즐겨찾기
- 관심 대회를 즐겨찾기에 추가
- localStorage 기반 영구 저장
- 한눈에 보는 즐겨찾기 목록

### 📅 구글 캘린더 연동
- **원클릭 캘린더 내보내기**
- ICS 파일 다운로드 지원
- 대회 7일 전/1일 전 자동 알림 설정

### 🎨 현대적인 UI/UX
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 다크 테마 기반 세련된 디자인
- 직관적인 필터 인터페이스
- 플로팅 액션 버튼

## 🛠️ 기술 스택

### Frontend
- **React 19** - 최신 React with Hooks
- **TypeScript 5.8** - 타입 안정성
- **Vite 6** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Lucide React** - 아이콘 라이브러리

### Data
- **ICS Format** - 표준 캘린더 데이터 포맷
- **LocalStorage** - 클라이언트 사이드 데이터 저장

## 🚀 시작하기

### 필수 요구사항
- **Node.js** 18.0.0 이상
- **npm** 9.0.0 이상

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/yourusername/RunD-day.git
   cd RunD-day
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:3300
   ```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📖 사용 방법

### 1. 대회 검색
<img width="600" alt="search" src="docs/images/search.png">

- 상단 검색창에 대회명, 지역, 태그 입력
- 실시간 필터링으로 즉시 결과 확인

### 2. 필터 적용
<img width="600" alt="filter" src="docs/images/filter.png">

- **MONTH** - 원하는 월 선택 (복수 선택 가능)
- **REGION** - 지역별 필터링
- **RESET** - 모든 필터 초기화

### 3. 즐겨찾기 추가
- 대회 카드의 하트 아이콘 클릭
- 즐겨찾기 섹션에서 모아보기

### 4. 캘린더 내보내기
<img width="600" alt="calendar" src="docs/images/calendar-button.png">

1. 우측 하단 **"캘린더 추가"** 버튼 클릭
2. `2026_마라톤_일정.ics` 파일 다운로드
3. 구글 캘린더에서 가져오기
   - 구글 캘린더 → 설정 → 가져오기 및 내보내기
   - 다운로드한 ICS 파일 선택

## 📁 프로젝트 구조

```
RunD-day/
├── components/           # React 컴포넌트
│   ├── FilterBar.tsx    # 필터 UI
│   ├── MarathonCard.tsx # 대회 카드
│   └── CalendarButton.tsx # 캘린더 버튼
├── public/              # 정적 파일
│   └── 2026_마라톤_일정.ics # 캘린더 데이터
├── App.tsx              # 메인 앱 컴포넌트
├── constants.ts         # 마라톤 데이터 & 상수
├── types.ts             # TypeScript 타입 정의
├── index.html           # HTML 엔트리
├── index.tsx            # React 엔트리
├── vite.config.ts       # Vite 설정
└── package.json         # 프로젝트 메타데이터
```

## 💻 개발

### 개발 가이드라인

#### 컴포넌트 추가
```tsx
// components/YourComponent.tsx
import React from 'react';

interface YourComponentProps {
  // props 정의
}

const YourComponent: React.FC<YourComponentProps> = (props) => {
  return (
    <div>
      {/* 컴포넌트 내용 */}
    </div>
  );
};

export default YourComponent;
```

#### 대회 데이터 추가
```typescript
// constants.ts
export const MARATHON_DATA: MarathonEvent[] = [
  {
    id: 'unique-id',
    name: '대회명',
    date: '2026-01-01',
    region: '서울',
    locationDetail: '상세 위치',
    distances: ['풀', '하프', '10km'],
    tags: ['인기대회', 'IAAF공인'],
    link: 'https://example.com'
  },
  // ...
];
```

### 코드 스타일
- **ESLint** - 코드 품질 검사
- **Prettier** - 코드 포맷팅
- **TypeScript** - 타입 안정성

### Git 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드/설정 변경
```

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 기여 가능한 영역
- 🆕 새로운 마라톤 대회 데이터 추가
- 🐛 버그 리포트 및 수정
- 📝 문서 개선
- 🎨 UI/UX 개선
- ✨ 새로운 기능 제안

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 만든 사람

- **개발자** - [InjunH](https://github.com/InjunH)
- **Co-Author** - Claude Sonnet 4.5

## 🙏 감사의 말

- 마라톤 대회 정보를 제공해주신 모든 주최 측에 감사드립니다
- 러닝 커뮤니티의 피드백에 감사드립니다

## 📞 문의

- **Email**: support@marathonalert.kr
- **Issues**: [GitHub Issues](https://github.com/yourusername/RunD-day/issues)

---

<div align="center">

**RunD-day** - 모든 러너를 위한 마라톤 일정 플랫폼

Made with ❤️ by Runners, for Runners

</div>

# Journey Test
Testing AI Journey data collection - Mon Jan 26 22:31:22 KST 2026

# Journey Test 2
Testing AI Journey - 2026-01-26 22:32:25

# Journey Test 3
Final test - 2026-01-26 22:32:54

# Journey Test 4
Test with increased body limit - 2026-01-26 22:33:59

# Journey Test 5
Final test with jq - 2026-01-26 22:34:43

# Journey Test 6
Final test with jq --rawfile - 2026-01-26 22:35:15

# Journey Success Test
Testing with new API key - 2026-01-26 22:41:53

# Journey Final Test
API key auth test - 2026-01-26 22:43:35

# Journey Complete
✅ 로컬 환경 테스트 성공 - 2026-01-26 22:44:21

# Test Commit
Testing git workflow - 2026-01-26 23:25:00
