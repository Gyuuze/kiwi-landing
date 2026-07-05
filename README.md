# Ziki 랜딩 페이지

뷰티·건기식 브랜드 대상 AI 숏폼 대행 서비스(Ziki)의 랜딩 + 무료 샘플 신청 페이지.
Tailwind CDN을 쓰는 단일 랜딩 페이지입니다. 신청 폼은 `/api/leads` API로 제출되고, 로컬에서는 `data/leads.jsonl`에 저장되며 배포 환경에서는 웹훅으로 연결해 실제 수집처에 쌓을 수 있습니다.

## 파일 구성
- `index.html` — 전체 페이지 (헤더 → 히어로 → 소셜프루프 → 문제 → 작동방식 → 기능 → 차별점 → 기대효과 → 가격 → FAQ → 신청 폼 → 푸터)
- `app.js` — 모바일 메뉴, 스크롤 페이드업, 신청 폼 제출 처리
- `api/leads.js` — 신청 폼 검증 + 저장 API
- `server.js` — 로컬 확인용 정적 파일/API 서버
- `.env.example` — 운영 환경 변수 예시
- `DEPLOYMENT.md` — Vercel, Google Sheets, 커스텀 도메인 배포 체크리스트
- `integrations/google-sheets-leads.gs` — Google Sheets 저장 + 이메일 알림용 Apps Script
- `assets/` — 히어로 샘플 영상(`sample-01~04.mp4`) + 포스터(`sample-01~04.jpg`). 540px·무음 루프용 경량 버전

## 실행
Node.js 18 이상에서:
```powershell
npm.cmd run dev
```
브라우저에서 `http://localhost:3000`을 열면 됩니다. 인터넷 연결 필요 (Tailwind·Pretendard를 CDN으로 불러옴).

PowerShell 실행 정책 때문에 `npm`이 막히면 아래처럼 직접 실행해도 됩니다.
```powershell
node server.js
```

로컬에서 폼을 제출하면 `data/leads.jsonl` 파일에 JSON Lines 형식으로 한 줄씩 저장됩니다. 이 폴더는 `.gitignore` 처리되어 실제 리드가 저장소에 올라가지 않습니다.

## 신청 폼 저장 흐름
현재 폼은 실제 API와 연결되어 있습니다.

- 브라우저: `index.html`의 `#leadForm` → `/api/leads`로 JSON 제출
- API: `api/leads.js`에서 필수값, URL, 이메일 형식 검증
- 로컬: `LEADS_WEBHOOK_URL`이 없으면 `data/leads.jsonl`에 누적 저장
- Vercel 등 배포 환경: `LEADS_WEBHOOK_URL`로 리드 데이터를 POST

배포 환경에서는 파일 시스템 저장이 영구 저장소가 아니므로 `LEADS_WEBHOOK_URL` 환경 변수를 반드시 설정해야 합니다.
실제 도메인을 연결한 뒤에는 `ALLOWED_ORIGINS`에 운영 도메인을 넣어 폼 API 호출 출처를 제한할 수 있습니다.

## Google Sheets에 쌓고 이메일 알림 받기
가장 간단한 운영 방식은 Google Sheets + Apps Script 웹앱입니다. 새 신청이 들어오면 시트에 저장하고 담당자 이메일로 알림을 보냅니다.

1. Google Sheets를 만들고 `확장 프로그램 > Apps Script`를 엽니다.
2. `integrations/google-sheets-leads.gs` 내용을 붙여 넣습니다.
3. Apps Script의 `프로젝트 설정 > 스크립트 속성`에 아래 값을 추가합니다.
   - `LEAD_NOTIFICATION_EMAILS`: 신청 알림을 받을 이메일. 여러 명이면 쉼표로 구분합니다.
   - `LEADS_WEBHOOK_SECRET`: 선택 사항이지만 운영에서는 설정 권장.
4. `배포 > 새 배포 > 웹 앱`에서 실행 권한은 본인, 액세스 권한은 `Anyone`으로 배포합니다.
5. 발급된 웹앱 URL을 Vercel 환경 변수 `LEADS_WEBHOOK_URL`에 넣습니다.
6. 3번에서 시크릿을 설정했다면 동일한 값을 Vercel 환경 변수 `LEADS_WEBHOOK_SECRET`에도 넣습니다.
7. 테스트 신청을 넣고 Google Sheets 행 추가와 이메일 알림 수신을 함께 확인합니다.

Make, Zapier, Airtable, 자체 백엔드도 JSON POST를 받을 수 있으면 같은 방식으로 연결할 수 있습니다.

## 카피·콘텐츠 교체 위치
- **서비스명**: `Ziki` (임시) — 헤더 로고·푸터·`<title>`에서 검색해 일괄 교체
- **연락처 메일**: `259official@gmail.com` — 푸터 문의 메일
- **샘플 영상**: 히어로의 4개 `<video src="assets/sample-0X.mp4">` 교체. 새 원본을 넣을 땐 540px·무음 루프로 압축 권장:
  `ffmpeg -i 원본.mp4 -vf "scale=540:-2" -c:v libx264 -crf 28 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart assets/sample-0X.mp4`
  포스터: `ffmpeg -ss 0.3 -i assets/sample-0X.mp4 -frames:v 1 assets/sample-0X.jpg`
- **숫자·메트릭**: 소셜프루프·기대효과 섹션 — ⚠️ 검증 전 메트릭(ROI·전환율·배수)은 넣지 말 것. 현재는 "목표/기대" 프레이밍으로 작성됨

## 배포 (선택, 추후)
API가 포함되어 있으므로 Vercel 배포를 권장합니다. 배포 후 `LEADS_WEBHOOK_URL` 환경 변수를 설정해야 실제 운영 리드가 영구 저장됩니다.
실제 도메인 연결 순서는 `DEPLOYMENT.md`를 참고하세요.

## 톤 & 디자인
- 미니멀 블랙앤화이트 (`#0A0A0A` 잉크 / `#FFFFFF` 페이퍼 / `#F5F5F5` 회색)
- Pretendard 폰트, 굵은 헤드라인 + 넉넉한 여백
- 모바일 우선 반응형
