# Ziki 랜딩 페이지

뷰티·건기식 브랜드 대상 AI 숏폼 대행 서비스(Ziki)의 랜딩 + 무료 샘플 신청 페이지.
빌드 툴 없이 브라우저로 바로 여는 **정적 단일 페이지**입니다. (정적 HTML + Tailwind CDN)

## 파일 구성
- `index.html` — 전체 페이지 (헤더 → 히어로 → 소셜프루프 → 문제 → 작동방식 → 기능 → 차별점 → 기대효과 → 가격 → FAQ → 신청 폼 → 푸터)
- `app.js` — 모바일 메뉴, 스크롤 페이드업, 신청 폼 제출 처리
- `assets/` — 히어로 샘플 영상(`sample-01~04.mp4`) + 포스터(`sample-01~04.jpg`). 540px·무음 루프용 경량 버전

## 실행
파일을 더블클릭하거나, PowerShell에서:
```powershell
start "index.html"
```
인터넷 연결 필요 (Tailwind·Pretendard를 CDN으로 불러옴).

## 신청 폼 연결 (Formspree)
현재 폼은 **미연결 상태**입니다. 이 상태에서도 제출하면 "신청 접수" 감사 메시지는 뜨지만, 실제로 데이터가 어디로도 전송되지 않습니다. 실제 수집을 하려면:

1. https://formspree.io 가입 → New Form 생성 (수신 메일: `259official@gmail.com`)
2. 발급된 엔드포인트(`https://formspree.io/f/abcdwxyz`)를 복사
3. `index.html`에서 폼 `action` 교체:
   ```html
   <form id="leadForm" action="https://formspree.io/f/XXXXXXX" method="POST" ...>
   ```
   → `XXXXXXX` 자리를 발급받은 ID로 교체
4. 끝. `app.js`가 자동으로 비동기 전송 + 페이지 이동 없이 감사 메시지를 띄웁니다.

> 대안: Google Forms 임베드, Netlify Forms, mailto 등. Formspree 무료 플랜이 가장 간단.

## 카피·콘텐츠 교체 위치
- **서비스명**: `Ziki` (임시) — 헤더 로고·푸터·`<title>`에서 검색해 일괄 교체
- **연락처 메일**: `259official@gmail.com` — 푸터, README의 Formspree 수신 메일
- **샘플 영상**: 히어로의 4개 `<video src="assets/sample-0X.mp4">` 교체. 새 원본을 넣을 땐 540px·무음 루프로 압축 권장:
  `ffmpeg -i 원본.mp4 -vf "scale=540:-2" -c:v libx264 -crf 28 -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart assets/sample-0X.mp4`
  포스터: `ffmpeg -ss 0.3 -i assets/sample-0X.mp4 -frames:v 1 assets/sample-0X.jpg`
- **숫자·메트릭**: 소셜프루프·기대효과 섹션 — ⚠️ 검증 전 메트릭(ROI·전환율·배수)은 넣지 말 것. 현재는 "목표/기대" 프레이밍으로 작성됨

## 배포 (선택, 추후)
정적 파일이라 Vercel / Netlify / GitHub Pages에 폴더째 drag-and-drop 하면 바로 배포됩니다.

## 톤 & 디자인
- 미니멀 블랙앤화이트 (`#0A0A0A` 잉크 / `#FFFFFF` 페이퍼 / `#F5F5F5` 회색)
- Pretendard 폰트, 굵은 헤드라인 + 넉넉한 여백
- 모바일 우선 반응형
