import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { getBusinessStats, getSystemStatus } from 'api/admin';
import StatusChip from 'components/StatusChip/StatusChip';
import { nivoDarkTheme, EMOTION_COLOR, EMOTION_LABEL } from './nivoTheme';

import './dashboardPage.scss';

const CONNECTION_LABEL: Record<string, string> = {
  mysql: 'MySQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
};

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = (error.response?.data as { message?: string } | undefined)?.message;
    return `${status ?? '네트워크 오류'}${serverMessage ? ` - ${serverMessage}` : ` - ${error.message}`}`;
  }
  return error instanceof Error ? error.message : '알 수 없는 오류';
};

const DashboardPage = (): ReactElement => {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
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

  const signupLineData = stats
    ? [
        {
          id: '신규가입',
          data: stats.signup_trend.map((point) => ({
            x: point.date.slice(5),
            y: point.count,
          })),
        },
      ]
    : [];

  const categoryBarData = stats
    ? [...stats.content_health.category_top5].reverse().map((c) => ({
        category: c.category,
        view_count: c.view_count,
      }))
    : [];

  const emotionPieData = stats
    ? (Object.entries(stats.content_health.emotion_distribution) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([emotion, ratio]) => ({
          id: EMOTION_LABEL[emotion] ?? emotion,
          label: EMOTION_LABEL[emotion] ?? emotion,
          value: Math.round(ratio * 1000) / 10,
          color: EMOTION_COLOR[emotion] ?? '#5D5D6D',
        }))
    : [];

  const dominantCounts = stats?.content_health.dominant_emotion_video_counts ?? [];

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
          {statsIsError ? (
            <span className="font-label-small overview-strip__error">
              비즈니스 지표 로드 실패 ({getErrorMessage(statsError)}){' '}
              <button type="button" className="overview-strip__retry" onClick={() => refetchStats()}>
                다시 시도
              </button>
            </span>
          ) : statsLoading || !stats ? (
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
              <Link to="/video-requests?status=PENDING" className="kpi-stat kpi-stat--link">
                <span className="kpi-stat__label font-label-small">
                  영상요청 대기 <em>(평균 {stats.video_request_pipeline.avg_processing_minutes.toFixed(0)}분)</em>
                </span>
                <span className="kpi-stat__value font-title-mini">
                  {stats.video_request_pipeline.pending_count}
                </span>
              </Link>
            </>
          )}
        </div>
      </div>

      {!statsLoading && stats && (
        <div className="chart-grid">
          <section className="chart-panel">
            <h3 className="font-title-mini">신규가입 추이 (최근 7일)</h3>
            <div className="chart-panel__body">
              <ResponsiveLine
                data={signupLineData}
                theme={nivoDarkTheme}
                colors={['#76FFCE']}
                margin={{ top: 16, right: 20, bottom: 32, left: 32 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                curve="monotoneX"
                axisBottom={{ tickSize: 0, tickPadding: 8 }}
                axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
                enableGridX={false}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh
              />
            </div>
          </section>

          <section className="chart-panel">
            <h3 className="font-title-mini">카테고리 Top 5 (조회수)</h3>
            <div className="chart-panel__body">
              <ResponsiveBar
                data={categoryBarData}
                theme={nivoDarkTheme}
                keys={['view_count']}
                indexBy="category"
                layout="horizontal"
                colors={['#F47263']}
                margin={{ top: 8, right: 24, bottom: 32, left: 70 }}
                padding={0.35}
                borderRadius={4}
                axisBottom={{ tickSize: 0, tickPadding: 8 }}
                axisLeft={{ tickSize: 0, tickPadding: 8 }}
                enableGridY={false}
                enableLabel={false}
                tooltip={({ indexValue, value }) => (
                  <div className="chart-panel__tooltip">
                    {indexValue}: {value.toLocaleString()}
                  </div>
                )}
              />
            </div>
          </section>

          <section className="chart-panel">
            <h3 className="font-title-mini">시청 감정 분포</h3>
            <div className="chart-panel__body chart-panel__body--pie">
              <ResponsivePie
                data={emotionPieData}
                theme={nivoDarkTheme}
                colors={{ datum: 'data.color' }}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                innerRadius={0.65}
                padAngle={1.5}
                cornerRadius={3}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                enableArcLinkLabels={false}
                arcLabel={(d) => `${d.value}%`}
                arcLabelsTextColor="#15151D"
                tooltip={({ datum }) => (
                  <div className="chart-panel__tooltip">
                    {datum.label}: {datum.value}%
                  </div>
                )}
              />
            </div>
            <ul className="chart-panel__legend">
              {emotionPieData.map((d) => (
                <li key={d.id}>
                  <span className="chart-panel__legend-dot" style={{ backgroundColor: d.color }} />
                  <span className="font-label-small">{d.label}</span>
                  <span className="font-label-small chart-panel__legend-value">{d.value}%</span>
                </li>
              ))}
            </ul>
            {dominantCounts.length > 0 && (
              <p className="chart-panel__hint font-label-small">
                대표 감정 기준 영상 수:{' '}
                {dominantCounts
                  .map((d) => `${EMOTION_LABEL[d.emotion] ?? d.emotion} ${d.video_count}개`)
                  .join(' · ')}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
