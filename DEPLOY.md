# Vercel 배포 가이드

## 배포 전 확인사항

1. **Flask 앱 확인**: `api/index.py` 파일이 올바르게 작성되었는지 확인
2. **의존성 확인**: `requirements.txt`에 필요한 패키지가 모두 포함되어 있는지 확인
3. **정적 파일**: `public/index.html`이 있는지 확인

## Vercel 배포 방법

### 방법 1: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치 (전역 설치)
npm i -g vercel

# 프로젝트 디렉토리에서 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동

1. GitHub에 저장소를 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 프레임워크: "Other" 선택
6. "Deploy" 클릭

## 주의사항

- Vercel의 serverless functions는 실행 시간 제한이 있습니다 (무료 플랜: 10초)
- 큰 엑셀 파일 처리 시 시간이 오래 걸릴 수 있습니다
- 파일 크기 제한: 4.5MB (무료 플랜)

## 문제 해결

### Python 패키지 오류
- `requirements.txt`에 모든 의존성이 포함되어 있는지 확인
- Vercel이 자동으로 `pip install`을 실행합니다

### API 엔드포인트 접근 오류
- `vercel.json`의 routes 설정 확인
- `/api/*` 경로가 `api/index.py`로 라우팅되는지 확인

### CORS 오류
- `flask-cors`가 설치되어 있는지 확인
- `CORS(app)` 설정이 있는지 확인

## 대안 배포 플랫폼

Vercel에 문제가 있거나 더 많은 리소스가 필요한 경우:

1. **Railway**: 무료 플랜, Python 앱 배포 쉬움
2. **Render**: 무료 플랜, Web Service로 배포
3. **Heroku**: 유료 (무료 플랜 중단됨)
4. **Streamlit Cloud**: Streamlit 앱 전용 (원본 Streamlit 버전 사용 시)
