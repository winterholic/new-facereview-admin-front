# FaceReview Admin 기획 문서

> 작성일: 2026-07-05
> 버전: 1.0
> 관련: [`new-facereview/docs/ADMIN_FEATURES.md`](https://github.com/winterholic/facereview-refactor-back/blob/main/docs/ADMIN_FEATURES.md) (백엔드 API 기획서, 이 문서의 "1. 현재 구현 기능"은 그 기획서 기준으로 실제 구현된 것을 정리한 것)

---

## 목차

1. [현재 구현 기능 (as-is)](#1-현재-구현-기능-as-is)
2. [Google Analytics(GA4) 연동 기획 — 착수 보류, 설계만](#2-google-analyticsga4-연동-기획--착수-보류-설계만)
3. [대시보드 통계 지표 고도화 기획](#3-대시보드-통계-지표-고도화-기획)

---

## 1. 현재 구현 기능 (as-is)

admin-front(이 저장소)와 백엔드(`new-facereview`) `app/routes/admin.py`가 실제로 연동 완료한 범위. 신규 계획이 아니라 **이미 배포된 기능의 기록**이다.

| 메뉴 | 화면 | 핵심 API | 데이터 출처 |
|---|---|---|---|
| 대시보드 | 시스템 상태 30초 폴링 (CPU/메모리/디스크, API 요청수/응답시간/에러율, MySQL·Redis·MongoDB 연결상태) + 비즈니스 지표(WAU·완주율·카테고리별 조회수·감정분포) + 기간 선택형 신규가입 추이(7일/30일/3달/1년/3년) | `GET /api/v2/admin/system/status`, `GET /api/v2/admin/dashboard/business-stats`, `GET /api/v2/admin/dashboard/signup-trend` | 호스트 리소스(psutil) + Redis 카운터 + MySQL/MongoDB 집계 |
| 회원 관리 | 목록(이름/이메일 검색, 탈퇴여부 필터, 페이지네이션) · 비활성화(soft delete) · 권한 변경(GENERAL↔ADMIN, **SUPER_ADMIN 전용**) | `GET/PATCH /api/v2/admin/users*` | MySQL `user` |
| 영상 관리 | 목록(제목/채널명 검색, 카테고리 필터) · 삭제(soft delete) | `GET/DELETE /api/v2/admin/videos*` | MySQL `video` |
| 영상 요청 관리 | 목록(상태 필터: PENDING/ACCEPTED/REJECTED) · 승인(제목·채널명·길이·카테고리 입력 → `video` 신규 등록) · 거절(사유 필수) | `GET/POST /api/v2/admin/video-requests*` | MySQL `video_request` |
| 댓글 관리 | 목록(영상별/키워드/삭제여부 필터) · 삭제(soft delete) | `GET/DELETE /api/v2/admin/comments*` | MySQL `comment` |

**인증 구조**: 별도 관리자 계정 체계가 아니라 일반 회원 계정(`user.role` 컬럼)을 그대로 사용. 최초 설계는 GENERAL/ADMIN 2단계였으나, 2026-07-05 **SUPER_ADMIN 역할이 추가**되어 현재는 GENERAL/ADMIN/SUPER_ADMIN 3단계다. 로그인 후 `/v2/auth/me`로 role을 확인해 ADMIN·SUPER_ADMIN이 아니면 즉시 로그아웃(백엔드 `admin_required` 데코레이터가 이 두 role만 허용). 회원 권한 변경(`PATCH /users/<id>/role`)만은 별도의 `super_admin_required` 데코레이터로 **SUPER_ADMIN 전용**으로 제한되어 있고, 프론트(`UsersPage.tsx`)도 SUPER_ADMIN 로그인 시에만 권한 변경 버튼을 노출하며 다른 SUPER_ADMIN 행에는 버튼 자체를 숨겨 오조작을 막는다. 최초 ADMIN/SUPER_ADMIN 계정은 DB에서 직접 role을 바꿔야 생성됨(자가 승격 경로 없음 — 의도된 설계).

**백엔드에 있지만 admin-front UI로는 아직 안 만든 것**: `POST /api/v2/admin/dummy-data`(테스트용 더미 시청기록 생성). `ADMIN_FEATURES.md` 기획 범위 밖이라 이번엔 제외 — 필요해지면 대시보드 하단에 개발자 전용 버튼으로 추가 가능.

---

## 2. Google Analytics(GA4) 연동 기획 — 착수 보류, 설계만

**전제**: 지금은 구현하지 않는다. GA4 속성 생성·트래킹 코드 삽입·API 키 발급 등 선행 작업을 사용자가 나중에 진행한 뒤 착수. 이 섹션은 그때 바로 실행할 수 있도록 미리 설계만 해둔 것.

### 왜 필요한가 (결정 질문)

지금 admin API(`video_view_log`, `user` 등)는 **로그인/시청 이후의 서비스 내부 행동**만 본다. GA4가 채워줄 결정 질문은 다음과 같다.

| 결정 질문 | GA4가 답할 수 있는 것 | 이 답으로 할 수 있는 행동 |
|---|---|---|
| 어느 유입 경로가 회원가입까지 이어지는가? | 채널별(검색/SNS/직접유입) 세션수 대비 가입 전환율 | 전환율 높은 채널에 마케팅 리소스 집중 |
| 어느 페이지에서 이탈하는가? | 랜딩페이지별 이탈률, 페이지 체류시간 | 이탈률 높은 화면 UX 개선 우선순위 결정 |
| 신규 vs 재방문 비율은 어떻게 변하는가? | 신규/재방문 세션 비율 추이 | 리텐션이 나쁘면 재방문 유도 기능(알림 등) 우선순위 상향 |

### 사전 요구사항 (사용자가 나중에 진행)

1. GA4 속성 생성 (Google Analytics 콘솔)
2. `facereview-front`(메인 서비스, 이 admin이 아니라 일반 사용자가 보는 화면)에 `gtag.js` 트래킹 코드 삽입 — **admin-front가 아니라 facereview-front 쪽 작업**
3. Google Cloud 프로젝트에서 서비스 계정 생성 → 해당 서비스 계정 이메일을 GA4 속성에 "뷰어" 권한으로 등록 → 서비스 계정 키(JSON) 발급
4. 서비스 계정 키를 Infisical(`facereview` 시크릿 경로)에 등록 — **절대 프론트엔드 번들에 포함하지 않는다** (git에도 커밋 금지)

### 구현 설계 (나중에 실행할 때 그대로 따를 순서)

```
[GA4 Data API] ← 서비스계정 인증 ← 백엔드(new-facereview) 신규 라우트
                                        │
                                        ▼
                              GET /api/v2/admin/analytics/overview
                                        │
                                        ▼
                              admin-front 대시보드 "트래픽" 섹션
```

- **백엔드 프록시 필수**: GA4 서비스 계정 키는 백엔드에만 존재해야 한다. admin-front는 백엔드가 이미 가공한 응답만 받는다(다른 admin API와 동일한 패턴, `admin_required` 데코레이터 재사용).
- **신규 백엔드 의존성**: `google-analytics-data` (공식 Python 클라이언트).
- **캐시 필수**: GA4 Data API는 무료 쿼터가 있다(하루 요청량 제한 — 정확한 한도는 실제 붙일 때 [Google 공식 문서](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas)에서 재확인). 대시보드가 30초마다 폴링하는 지금 패턴을 GA4 카드에 그대로 적용하면 쿼터를 빠르게 소모하므로, **최소 5~10분 캐시**(Redis, 기존 `_MEM_CACHE` 폴백 패턴 재사용 가능)를 두고 그 안에서만 재조회.

### 표시할 지표 (1차 후보)

| 지표 | GA4 리포트 | 비고 |
|---|---|---|
| 일별 방문자수(순사용자) | `activeUsers` | 기본 |
| 신규 vs 재방문 비율 | `newVsReturning` | 리텐션 프록시 |
| 유입 채널 Top 5 | `sessionDefaultChannelGroup` | 마케팅 채널 판단 |
| 주요 랜딩페이지 이탈률 | `bounceRate` by `landingPage` | UX 우선순위 |
| 디바이스 분포 | `deviceCategory` | 모바일 최적화 판단 근거 |

### 리스크 · 확인 필요

- facereview-front에 `gtag.js`가 실제로 붙어있는지 **미확인** — 붙어있지 않다면 이 섹션 전체가 선행작업(프론트 트래킹 코드 삽입) 없이는 무의미.
- 개인정보 처리방침에 GA4 사용 고지가 필요할 수 있음(IP 등 처리) — 법적 검토 필요.
- 무료 쿼터 수치는 변동 가능 — 실제 연동 시점에 공식 문서 재확인.

---

## 3. 대시보드 통계 지표 고도화 기획

> **구현 완료 (2026-07-05)**. 아래 §3.4는 최초 설계였고, 실제로는 §3.2 조사 중 더 나은 방법(이미 실시간 유지되는 `video_distribution` 컬렉션 재사용)을 발견해 **신규 배치 테이블·스케줄 잡 없이** 더 가볍게 구현했다. 실제 구현은 §3.4a 참고. 백엔드 `GET /api/v2/admin/dashboard/business-stats`, 프론트 `DashboardPage.tsx` 재설계 완료.

### 3.1 문제 진단

현재 대시보드(`GET /api/v2/admin/system/status`)는 **CPU/메모리/디스크/API 응답시간/DB 연결상태**를 화면 상단에 크게 표시한다. 이건 "서버가 죽었는가"를 보는 **운영(ops) 모니터링** 지표이지, "서비스가 잘 되고 있는가"를 보는 **비즈니스 지표**가 아니다. 관리자가 매일 열어볼 화면에 사소한 인프라 수치가 크게 뜨고, 정작 회원/영상/콘텐츠 관련 의사결정에 쓸 지표는 하나도 없다.

**방향**: 시스템 상태는 화면 하단에 작은 상태 배지(정상/경고)로 축소하고, 상단은 아래 비즈니스 지표 위계로 교체한다. (biz-data-analyst 원칙: 차트 더미가 아니라 "무엇을 보고 무엇을 할지"가 보이는 소수 핵심 지표.)

### 3.2 연산 비용 관점에서 먼저 짚어야 할 것

기존 코드를 직접 확인한 결과, 이 서비스 데이터 구조상 **지표마다 계산 비용이 크게 다르다**. 무심코 다 넣으면 사용자가 우려한 "연산효율 낮은 지표"가 섞여 들어간다.

| 데이터 | 비용 특성 | 근거 |
|---|---|---|
| `video.view_count` | **가벼움** — 이미 컬럼에 카운터로 저장돼 있음(매 조회마다 재계산 안 함) | `app/models/video.py` |
| `video.like_count` / `comment_count` | **주의** — 컬럼이 아니라 `@property`로 매번 `COUNT()` 서브쿼리 실행. 영상 목록(페이지당 20건) 조회마다 최대 40개 추가 쿼리(N+1) | `app/models/video.py:95-101` |
| `video_view_log` 전체 기간 집계(DAU/일별 시청수 등) | **무거움** — 테이블에 `(user_id, created_at)`·`(video_id, created_at)` 복합 인덱스만 있고 **`created_at` 단독 인덱스가 없음**. "오늘 전체 시청수" 같은 영상/유저 특정 없는 시간대 집계는 인덱스를 못 타 풀스캔에 가까워짐 | `app/models/video_view_log.py:55-58` |
| MongoDB `youtube_watching_data` (감정분석 원본) | **매우 무거움** — 세션당 문서 1개에 `emotion_score_timeline`이 센티초 단위 키로 쌓임(영상 길이에 비례해 문서 크기 증가). `video_id`/`user_id` 필터 없이 전체 기간 감정분포를 집계하면 대형 문서를 다수 스캔 | `app/models/mongodb/youtube_watching_data.py` |

**원칙**: 위 표의 "무거움"·"매우 무거움" 지표는 **대시보드 로드 시 즉석 쿼리 금지**. 이미 이 코드베이스에 있는 패턴(APScheduler로 30분 주기 추천 풀 사전계산, `common/utils/recommendation_alg.py`)을 그대로 재사용해 **배치로 미리 집계해 캐시/테이블에 저장**하고, 대시보드는 그 결과만 읽는다.

### 3.3 지표 위계 (결정 질문 → 지표)

차트를 나열하지 않고, "이 숫자가 나쁘면 무엇을 할지"가 있는 것만 넣는다.

| # | 결정 질문 | 지표(North Star는 ★) | 비용 | 수집 방식 |
|---|---|---|---|---|
| 1 | 서비스가 성장하고 있는가? | 신규 가입자 수(일/주) | 가벼움 | `user.created_at` 실시간 COUNT (테이블 크기가 view_log보다 훨씬 작아 당장은 즉석 쿼리 가능, 회원 100만 단위로 커지면 배치 전환 검토) |
| 2 | 시청자가 실제로 돌아오는가? | ★ 주간 활성 시청자수(WAU, 최근 7일 `video_view_log` distinct user_id) | 무거움 → 배치 | 일 1회 배치 집계(자정 등) 후 결과만 테이블/Redis에 저장 |
| 3 | 콘텐츠를 끝까지 보는가? (추천 품질의 대리지표) | 평균 완주율(`youtube_watching_data.completion_rate` 평균, 최근 N일) | 매우 무거움 → 배치 | MongoDB 세션 문서에서 `completion_rate`만 프로젝션(무거운 timeline 필드 제외)해 배치 집계 |
| 4 | 어떤 카테고리가 잘 되는가? | 카테고리별 시청수·좋아요수 Top 5 | 무거움(시청수) + 주의(좋아요 N+1) → 배치 | 배치로 `video.category` 기준 사전 집계, 좋아요는 `video_like` 테이블에서 GROUP BY로 일괄 집계(현재의 개별 `.count()` 방식 대신) |
| 5 | 영상 요청 파이프라인이 밀리고 있는가? | 대기중(PENDING) 건수 + 평균 처리 소요시간(승인/거절까지) | 가벼움 | `video_request` 테이블 자체가 작아 즉석 쿼리로 충분 |
| 6 | 커뮤니티가 건강한가? | 일별 신규 댓글 수, 삭제율(전체 대비 `is_deleted` 비율) | 가벼움~보통 | 댓글 테이블도 상대적으로 작음. 다만 전체 기간 집계는 `idx_video_comments`가 `video_id` 선두라 "영상 무관 전체" 집계엔 도움 안 됨 — 필요시 `created_at` 보조 인덱스 검토 |
| 7 | 사용자가 어떤 감정을 가장 많이 느끼는가? (제품 고유의 재미 지표) | 도미넌트 감정(happy/sad/angry 등) 분포 | 매우 무거움 → 배치 | #3과 같은 배치 잡에서 함께 집계(한 번 스캔에 완주율+감정분포 둘 다 뽑기) |

### 3.4 구현 제안 (최초 설계 — §3.4a로 대체됨)

1. **배치 집계 신규 테이블**: `admin_daily_stats`(MySQL) 1행/1일 — WAU, 평균 완주율, 감정분포 JSON, 카테고리별 Top5 JSON, 댓글 순증감 등을 하루 1회 계산해 저장. 기존 APScheduler(`common/utils/recommendation_alg.py`와 동일 프로세스)에 잡 하나 추가하는 방식이면 새 인프라 없이 재사용 가능.
2. **대시보드 API 분리**: 기존 `GET /api/v2/admin/system/status`(운영 지표)는 그대로 두고, 신규 `GET /api/v2/admin/dashboard/business-stats`를 만들어 `admin_daily_stats`의 최신 행 + #1·#5(즉석 쿼리 가능한 가벼운 것)만 합쳐 응답.
3. **화면 배치**: 상단에 WAU·완주율·신규가입·영상요청 대기건수를 큰 숫자 카드로, 카테고리 Top5·감정분포는 그 아래 보조 섹션으로, 기존 시스템 상태(CPU 등)는 맨 하단에 작은 상태 배지 3개(MySQL/Redis/MongoDB 정상 여부만, 수치는 접어두기)로 축소.
4. **단계적 진행 제안**:
   - Phase 1 (가벼움만, 즉시 가능): 신규가입 추이, 영상요청 대기건수·처리시간
   - Phase 2 (배치 인프라 필요): WAU, 완주율, 카테고리 Top5, 감정분포

### 3.4a 실제 구현 (2026-07-05)

구현 과정에서 `app/models/mongodb/video_distribution.py`를 다시 확인해보니, **완주율·감정분포는 이미 실시간으로 유지되고 있는 데이터**였다: `watch_frame` 이벤트마다 `VideoDistributionRepository.increment_emotion()`이 영상당 문서 1개(`video_distribution`, 세션 원본이 아니라 영상 단위 집계본)의 `average_completion_rate`·`emotion_averages`를 그 자리에서 재계산해둔다. 즉 이 컬렉션은 이미 "배치 없이도 가벼운" 사전집계본이었다 — §3.4의 "완주율/감정분포는 무거우니 배치가 필요하다"는 판단은 `youtube_watching_data`(세션 원본)만 보고 내린 오판이었고, `video_distribution`(영상당 1문서, 세션 수가 아니라 영상 수에 비례)을 놓쳤던 것.

그래서 신규 테이블·신규 APScheduler 잡 없이 다음과 같이 구현했다(`app/services/admin_service.py`):

| 지표 | 실제 구현 |
|---|---|
| 신규가입 추이(7일) | `user.created_at` GROUP BY DATE, 즉석 쿼리 |
| WAU | `video_view_log` COUNT(DISTINCT user_id), Redis 15분 캐시(`facereview:admin:wau`) — 여전히 무거운 유일한 지표라 캐시로 완화 |
| 영상요청 대기건수·평균처리시간 | `video_request` 즉석 쿼리(`TIMESTAMPDIFF`) |
| 평균 완주율·감정분포 | `video_distribution` 컬렉션 `$group`/`$avg` 한 번 (세션 원본 미스캔) |
| 카테고리별 조회수 | `video.view_count` GROUP BY category, 즉석 쿼리 — 최초엔 Top5만 잘랐으나(§3.3 설계), GenreEnum이 16종으로 자연히 상한이 있어 **2026-07-05에 전체 카테고리 반환으로 변경**(`category_top5` 필드명은 하위 호환 위해 유지, `app/services/admin_service.py` 주석 참고) |

추가로 `video_view_log`에 `created_at` 단독 인덱스가 없어 WAU 쿼리가 인덱스를 못 타는 문제는 여전히 남아있어, `docs/MARIA_CREATE_QUERY.txt`(로컬 전용)에 `ALTER TABLE video_view_log ADD INDEX idx_created_at (created_at);`를 남겨뒀다 — **prod DB에 수동 실행 필요** (배포 파이프라인이 DDL을 안 태움, 2026-07-05 시점까지 미실행).

신규 엔드포인트: `GET /api/v2/admin/dashboard/business-stats`. 프론트는 `DashboardPage.tsx`에서 KPI 카드(WAU·완주율·오늘 신규가입·영상요청 대기) → 신규가입 추이 바 → 카테고리별 조회수/감정분포 2단 → 기존 시스템 상태는 `<details>`로 접어 하단 배치.

**신규가입 추이 기간 선택 (2026-07-05 추가, §3.4 설계엔 없던 확장)**: 최초 구현은 7일 고정이었으나, 별도 엔드포인트 `GET /api/v2/admin/dashboard/signup-trend?period=`(`7d`/`30d`/`3m`/`1y`/`3y`)를 신규 추가해 대시보드에서 기간을 직접 선택할 수 있게 했다. 일 단위로 한 번만 집계한 뒤 기간이 길어지면(`3m`은 주 단위, `1y`/`3y`는 월 단위) 파이썬에서 버킷만 묶어 SQL 날짜연산(YEARWEEK 등) 없이 동일한 결과를 낸다(`AdminService.get_signup_trend`).

### 3.5 가설·성공지표·확인 시점 (biz-experts 공통 규칙)

- **가설**: 시스템 리소스 대신 WAU·완주율·카테고리 Top5를 상단에 두면, 관리자가 대시보드를 열었을 때 "오늘 무엇을 할지"를 더 빨리 판단할 수 있다.
- **성공 지표**: (정성) 사용자가 실제로 대시보드를 보고 콘텐츠/운영 판단을 내리는 빈도 증가. (정량 후보, 확인 필요) 대시보드 체류시간·재방문 빈도는 이 admin 자체엔 트래킹이 없어 측정 불가 — 필요하면 admin-front에도 최소한의 자체 로깅 추가 검토.
- **확인 시점**: Phase 1 반영 후 2주, 실제로 이 지표들을 보고 의사결정(예: 특정 카테고리 영상 추가 요청, 재방문 유도 기능 우선순위)에 썼는지 재검토.

### 3.6 확인 필요 목록

- **`video_view_log(created_at)` 인덱스를 prod에 수동 추가해야 함** — 안 하면 WAU 쿼리(15분마다 최대 1회)가 인덱스를 못 타 느려질 수 있음. `docs/MARIA_CREATE_QUERY.txt` 참고.
- prod Redis가 불통이면([[project-facereview]] 메모리의 알려진 이슈) WAU 캐시가 안 걸려 매번 즉석 쿼리로 폴백함 — 당장 기능은 동작하지만 Redis 복구 전까진 WAU 쿼리 비용을 매번 지불.
- 회원/시청기록 수가 지금보다 훨씬 커지면(수십만~수백만) 신규가입 추이·영상요청 파이프라인도 즉석 쿼리 대신 캐시/배치가 필요해질 수 있음 — 데이터량 재확인 후 판단.
- `video_distribution`은 실시간 갱신이라 사실상 "지금 이 순간까지의 누적" 값 — 일별/주별 스냅샷이 필요해지면(예: "지난주 대비 완주율 변화") 그때는 진짜로 배치 스냅샷이 필요함.
