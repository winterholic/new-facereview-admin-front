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

  const { data: system } = useQuery({
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

      <div className="overview-strip">
        <div className="overview-strip__row overview-strip__row--connections">
          {system ? (
            Object.entries(system.connections).map(([key, status]) => (
              <div key={key} className="overview-strip__connection">
                <span className="font-label-small">{CONNECTION_LABEL[key] ?? key}</span>
                <StatusChip
                  label={status === 'ok' ? '정상' : '오류'}
                  tone={status === 'ok' ? 'accepted' : 'danger'}
                />
              </div>
            ))
          ) : (
            <span className="font-label-small overview-strip__muted">시스템 상태 확인 중...</span>
          )}
          {system && (
            <span className="overview-strip__sysmetrics font-label-small">
              CPU {system.server.cpu_usage.toFixed(0)}% · 메모리 {system.server.memory_usage.toFixed(0)}% ·
              디스크 {system.server.disk_usage.toFixed(0)}% · API {system.api.total_requests_1h.toLocaleString()}
              건/1h · 평균 {system.api.avg_response_time_ms.toFixed(0)}ms · 에러율{' '}
              {system.api.error_rate_1h.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="overview-strip__row overview-strip__row--kpi">
          {statsLoading || !stats ? (
            <span className="font-label-small overview-strip__muted">불러오는 중...</span>
          ) : (
            <>
              <div className="kpi-stat">
                <span className="kpi-stat__label font-label-small">주간 활성 시청자</span>
                <span className="kpi-stat__value font-title-mini">
                  {stats.weekly_active_users.toLocaleString()}
                </span>
              </div>
              <div className="kpi-stat">
                <span className="kpi-stat__label font-label-small">평균 완주율</span>
                <span className="kpi-stat__value font-title-mini">
                  {(stats.content_health.avg_completion_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="kpi-stat">
                <span className="kpi-stat__label font-label-small">
                  오늘 신규가입 <em>(7일 합계 {weekSignups})</em>
                </span>
                <span className="kpi-stat__value font-title-mini">{todaySignups}</span>
              </div>
              <div className="kpi-stat">
                <span className="kpi-stat__label font-label-small">
                  영상요청 대기 <em>(평균 {stats.video_request_pipeline.avg_processing_minutes.toFixed(0)}분)</em>
                </span>
                <span className="kpi-stat__value font-title-mini">
                  {stats.video_request_pipeline.pending_count}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {!statsLoading && stats && (
        <>
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
    </div>
  );
};

export default DashboardPage;
