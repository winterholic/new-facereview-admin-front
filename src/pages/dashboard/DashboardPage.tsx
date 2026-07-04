import type { ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBusinessStats, getSystemStatus } from 'api/admin';
import StatusChip from 'components/StatusChip/StatusChip';

import './dashboardPage.scss';

const CONNECTION_LABEL: Record<string, string> = {
  mysql: 'MySQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
};

const EMOTION_LABEL: Record<string, string> = {
  happy: '기쁨',
  surprise: '놀람',
  neutral: '무표정',
  sad: '슬픔',
  angry: '분노',
};

const DashboardPage = (): ReactElement => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'business-stats'],
    queryFn: async () => (await getBusinessStats()).data,
    refetchInterval: 60000,
  });

  const { data: system, isLoading: systemLoading } = useQuery({
    queryKey: ['admin', 'system-status'],
    queryFn: async () => (await getSystemStatus()).data,
    refetchInterval: 30000,
  });

  const todaySignups = stats?.signup_trend.at(-1)?.count ?? 0;
  const weekSignups = stats?.signup_trend.reduce((sum, point) => sum + point.count, 0) ?? 0;
  const maxSignup = Math.max(1, ...(stats?.signup_trend.map((p) => p.count) ?? [1]));
  const maxCategoryViews = Math.max(1, ...(stats?.content_health.category_top5.map((c) => c.view_count) ?? [1]));
  const emotionEntries = stats
    ? (Object.entries(stats.content_health.emotion_distribution) as [string, number][]).sort(
        (a, b) => b[1] - a[1],
      )
    : [];

  return (
    <div className="dashboard-page">
      <h2 className="font-title-large">대시보드</h2>
      <p className="dashboard-page__subtitle font-body-medium">1분마다 자동 갱신됩니다.</p>

      {statsLoading || !stats ? (
        <p className="dashboard-page__loading font-body-medium">불러오는 중...</p>
      ) : (
        <>
          <div className="dashboard-page__kpi-grid">
            <div className="kpi-card">
              <span className="kpi-card__label font-label-small">주간 활성 시청자 (WAU)</span>
              <span className="kpi-card__value font-title-large">
                {stats.weekly_active_users.toLocaleString()}
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label font-label-small">평균 완주율</span>
              <span className="kpi-card__value font-title-large">
                {(stats.content_health.avg_completion_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label font-label-small">오늘 신규가입</span>
              <span className="kpi-card__value font-title-large">{todaySignups}</span>
              <span className="kpi-card__hint font-label-small">최근 7일 합계 {weekSignups}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label font-label-small">영상요청 대기</span>
              <span className="kpi-card__value font-title-large">
                {stats.video_request_pipeline.pending_count}
              </span>
              <span className="kpi-card__hint font-label-small">
                평균 처리 {stats.video_request_pipeline.avg_processing_minutes.toFixed(0)}분
              </span>
            </div>
          </div>

          <section className="dashboard-page__section">
            <h3 className="font-title-mini">신규가입 추이 (최근 7일)</h3>
            <div className="bar-list">
              {stats.signup_trend.map((point) => (
                <div key={point.date} className="bar-list__row">
                  <span className="bar-list__label font-label-small">{point.date.slice(5)}</span>
                  <div className="bar-list__track">
                    <div
                      className="bar-list__fill"
                      style={{ width: `${(point.count / maxSignup) * 100}%` }}
                    />
                  </div>
                  <span className="bar-list__value font-label-small">{point.count}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="dashboard-page__two-col">
            <section className="dashboard-page__section">
              <h3 className="font-title-mini">카테고리 Top 5 (조회수)</h3>
              <div className="bar-list">
                {stats.content_health.category_top5.map((c) => (
                  <div key={c.category} className="bar-list__row">
                    <span className="bar-list__label font-label-small">{c.category}</span>
                    <div className="bar-list__track">
                      <div
                        className="bar-list__fill bar-list__fill--brand"
                        style={{ width: `${(c.view_count / maxCategoryViews) * 100}%` }}
                      />
                    </div>
                    <span className="bar-list__value font-label-small">
                      {c.view_count.toLocaleString()}
                    </span>
                  </div>
                ))}
                {stats.content_health.category_top5.length === 0 && (
                  <p className="dashboard-page__empty font-body-medium">데이터가 없습니다.</p>
                )}
              </div>
            </section>

            <section className="dashboard-page__section">
              <h3 className="font-title-mini">시청 감정 분포</h3>
              <div className="bar-list">
                {emotionEntries.map(([emotion, ratio]) => (
                  <div key={emotion} className="bar-list__row">
                    <span className="bar-list__label font-label-small">
                      {EMOTION_LABEL[emotion] ?? emotion}
                    </span>
                    <div className="bar-list__track">
                      <div
                        className="bar-list__fill bar-list__fill--emotion"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <span className="bar-list__value font-label-small">
                      {(ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <details className="dashboard-page__system">
        <summary className="font-label-medium">시스템 상태 (운영 모니터링)</summary>
        {systemLoading || !system ? (
          <p className="dashboard-page__loading font-body-medium">불러오는 중...</p>
        ) : (
          <div className="dashboard-page__system-body">
            <div className="dashboard-page__connections">
              {Object.entries(system.connections).map(([key, status]) => (
                <div key={key} className="connection-item">
                  <span className="font-label-medium">{CONNECTION_LABEL[key] ?? key}</span>
                  <StatusChip
                    label={status === 'ok' ? '정상' : '오류'}
                    tone={status === 'ok' ? 'accepted' : 'danger'}
                  />
                </div>
              ))}
            </div>
            <div className="dashboard-page__grid">
              <div className="stat-card">
                <span className="stat-card__label font-label-small">CPU</span>
                <span className="stat-card__value font-title-mini">
                  {system.server.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">메모리</span>
                <span className="stat-card__value font-title-mini">
                  {system.server.memory_usage.toFixed(1)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">디스크</span>
                <span className="stat-card__value font-title-mini">
                  {system.server.disk_usage.toFixed(1)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">API 요청(1h)</span>
                <span className="stat-card__value font-title-mini">
                  {system.api.total_requests_1h.toLocaleString()}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">평균 응답</span>
                <span className="stat-card__value font-title-mini">
                  {system.api.avg_response_time_ms.toFixed(0)}ms
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">에러율(1h)</span>
                <span className="stat-card__value font-title-mini">
                  {system.api.error_rate_1h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </details>
    </div>
  );
};

export default DashboardPage;
