// Ziki 랜딩 — 인터랙션
(function () {
  'use strict';

  /* ---------- 모바일 메뉴 토글 ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('hidden') === false;
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });

    // 메뉴 안 링크 클릭 시 닫기
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', '메뉴 열기');
      });
    });
  }

  /* ---------- 스크롤 진입 페이드업 ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    // 폴백: 전부 표시
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 히어로 샘플 영상 ---------- */
  const sampleCards = Array.prototype.slice.call(document.querySelectorAll('.sample-card'));
  const sampleVideos = sampleCards.map(function (c) { return c.querySelector('video'); });

  // 화면에 보이면 muted 자동재생, 벗어나면 일시정지(성능)
  if ('IntersectionObserver' in window && sampleVideos.length) {
    const vio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const v = entry.target;
          if (entry.isIntersecting) {
            if (v.muted) { v.play().catch(function () {}); }
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.4 }
    );
    sampleVideos.forEach(function (v) { vio.observe(v); });
  }

  // 카드 클릭: 해당 영상만 소리 켜고 재생, 나머지는 음소거 루프로
  sampleCards.forEach(function (card) {
    const video = card.querySelector('video');
    const badge = card.querySelector('.play-badge');
    card.addEventListener('click', function () {
      const turnOn = video.muted; // 현재 음소거면 → 소리 켜기
      sampleVideos.forEach(function (other) {
        if (other !== video) {
          other.muted = true;
          other.currentTime = other.currentTime; // keep
          other.play().catch(function () {});
          const b = other.parentElement.querySelector('.play-badge');
          if (b) b.classList.remove('hidden');
        }
      });
      if (turnOn) {
        video.muted = false;
        video.play().catch(function () {});
        if (badge) badge.classList.add('hidden');
      } else {
        video.muted = true;
        if (badge) badge.classList.remove('hidden');
      }
    });
  });

  /* ---------- 리드 폼 제출 ---------- */
  const form = document.getElementById('leadForm');
  const thanks = document.getElementById('leadThanks');

  if (form) {
    form.addEventListener('submit', function (e) {
      // 브라우저 기본 유효성 검사(required, type=email/url) 먼저
      if (!form.checkValidity()) {
        return; // 브라우저가 에러 메시지 노출
      }

      const action = form.getAttribute('action') || '';
      const configured = action && action.indexOf('XXXX') === -1;

      // Formspree 미연결(플레이스홀더) 상태면: 기본 제출 막고 감사 메시지만 표시
      if (!configured) {
        e.preventDefault();
        showThanks();
        return;
      }

      // Formspree 연결됨: fetch로 비동기 제출 → 페이지 이동 없이 감사 메시지
      e.preventDefault();
      const data = new FormData(form);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = '전송 중...'; }

      fetch(action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (res.ok) {
            showThanks();
          } else {
            alert('전송에 실패했어요. 잠시 후 다시 시도하거나 rbtjcjswo@gmail.com 으로 연락 주세요.');
            if (btn) { btn.disabled = false; btn.textContent = '무료 샘플 신청하기'; }
          }
        })
        .catch(function () {
          alert('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
          if (btn) { btn.disabled = false; btn.textContent = '무료 샘플 신청하기'; }
        });
    });
  }

  function showThanks() {
    if (form) form.classList.add('hidden');
    if (thanks) {
      thanks.classList.remove('hidden');
      thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();
