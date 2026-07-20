# 개발 환경 설정 - 토닥루틴도우미

## 요구사항

- Node.js 20 권장
- npm
- Git
- HTTPS 배포 주소 또는 설치된 PWA

## 설치와 실행

PowerShell에서 저장소 폴더를 연 뒤 실행합니다.

```powershell
npm.cmd install
npm.cmd run dev
```

개발 서버 기본 주소는 `http://localhost:5173`입니다.

## 빌드

GitHub Actions와 일반 배포용:

```powershell
npm.cmd run build
```

결과는 `dist/`에 생성됩니다.

별도 수동 Pages 산출물:

```powershell
npm.cmd run build:pages
```

결과는 `dist-pages/`에 생성됩니다. `docs/`는 프로젝트 문서 폴더이므로 빌드 결과로 사용하지 않습니다.

## 실기기 확인

1. HTTPS로 배포된 앱 또는 홈 화면에 설치한 PWA를 엽니다.
2. 첫기상, 첫수, 막수 시간을 입력합니다.
3. 낮잠 길이와 이유식 횟수를 바꿔 일정이 즉시 갱신되는지 확인합니다.
4. 앱을 닫았다가 다시 열어 입력값이 유지되는지 확인합니다.

## 검증 명령

```powershell
npm.cmd run build
node --check public\service-worker.js
```

## 트러블슈팅

- 설치형 앱처럼 확인하려면 HTTPS 배포 주소 또는 홈 화면에 추가한 PWA로 테스트합니다.
- 토닥루틴도우미 PWA에는 일정 알림 기능이 없습니다.
- 해결 기록은 `docs/CHANGELOG.md`의 `PROB-XXX` 항목을 먼저 확인합니다.
