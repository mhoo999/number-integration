# 푸터 컴포넌트 프롬프트

다음 프롬프트를 사용하여 다른 Next.js 프로젝트에 동일한 푸터를 추가하세요.

---

## 프롬프트

```
페이지 하단에 푸터를 추가해줘. 모노톤 플랫 디자인으로 만들어줘.

푸터 구조:
1. 두 개의 버튼 (가운데 정렬)
   - "다른 서비스 이용해보기" 버튼 → https://hoons-service-archive.vercel.app (새 탭)
   - "개발자 커피 한잔 사주기" 버튼 → https://need-coffee.vercel.app (새 탭)

2. 이메일 주소 (버튼 아래, 가운데 정렬, 링크 없음)
   - mhoo999@naver.com

디자인 요구사항:
- 모노톤 플랫 디자인 (검정, 흰색, 회색만 사용)
- 버튼: 검정 배경, 흰색 텍스트, 호버 시 배경색 약간 밝게 (#333333)
- 버튼은 가운데 정렬, flexbox로 배치 (모바일에서는 세로 배치)
- 상단에 얇은 회색 구분선 (border-top: 1px solid #e5e5e5)
- 이메일: 회색 텍스트 (#666666), 작은 폰트 (0.875rem)
- 하단 여백 최소화 (padding-bottom: 1rem)

CSS 모듈 사용:
- .footerSection: 전체 푸터 컨테이너, 가운데 정렬, 상단 패딩 2.5rem, 하단 패딩 1rem
- .buttonGroup: 버튼 그룹, flexbox, 가운데 정렬, gap 1rem, 하단 마진 1.5rem
- .buttonLink: 버튼 스타일 (기존 버튼 스타일 재사용)
- .emailSection: 이메일 섹션, 회색 텍스트, 작은 폰트

반응형:
- 모바일 (max-width: 768px): 버튼을 세로로 배치, 전체 너비
```

---

## 코드 예시

### React 컴포넌트 (page.tsx 또는 별도 컴포넌트)

```tsx
<div className={styles.footerSection}>
  <div className={styles.buttonGroup}>
    <a
      href="https://hoons-service-archive.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.button} ${styles.buttonLink}`}
    >
      다른 서비스 이용해보기
    </a>
    <a
      href="https://need-coffee.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.button} ${styles.buttonLink}`}
    >
      개발자 커피 한잔 사주기
    </a>
  </div>
  <div className={styles.emailSection}>
    mhoo999@naver.com
  </div>
</div>
```

### CSS 모듈 (page.module.css 또는 별도 파일)

```css
.buttonLink {
  text-decoration: none;
  display: inline-block;
}

.buttonGroup {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.footerSection {
  margin-top: 3rem;
  padding-top: 2.5rem;
  padding-bottom: 1rem;
  border-top: 1px solid #e5e5e5;
  text-align: center;
}

.emailSection {
  color: #666666;
  font-size: 0.875rem;
}

/* 기존 버튼 스타일 (필요한 경우) */
.button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #000000;
  background-color: #ffffff;
  color: #000000;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  font-weight: 400;
}

.button:hover:not(:disabled) {
  background-color: #000000;
  color: #ffffff;
}

.buttonPrimary {
  width: 100%;
  background-color: #000000;
  color: #ffffff;
  padding: 1rem;
  font-size: 1.125rem;
}

.buttonPrimary:hover:not(:disabled) {
  background-color: #333333;
}

/* 반응형 */
@media (max-width: 768px) {
  .buttonGroup {
    flex-direction: column;
  }

  .buttonGroup .button {
    width: 100%;
  }
}
```

---

## 단계별 적용 방법

1. **프롬프트 사용**: 위의 프롬프트를 AI에게 보내고, 프로젝트 구조를 설명
2. **코드 복사**: 위의 코드 예시를 직접 복사하여 적용
3. **스타일 조정**: 프로젝트에 맞게 색상이나 간격을 조정

---

## 커스터마이징 포인트

- **버튼 텍스트**: 원하는 텍스트로 변경 가능
- **링크 URL**: 각 버튼의 href 변경 가능
- **이메일 주소**: 이메일 주소 변경 가능
- **색상**: 모노톤 유지하면서 색상 조정 가능
- **간격**: margin, padding 값 조정 가능

---

## 주의사항

- `rel="noopener noreferrer"`: 외부 링크 보안을 위해 필수
- `target="_blank"`: 새 탭에서 열리도록 설정
- 반응형 디자인: 모바일에서도 잘 보이도록 확인
