import type { ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemStatus } from 'api/admin';
import StatusChip from 'components/StatusChip/StatusChip';

import './dashboardPage.scss';

const CONNECTION_LABEL: Record<string, string> = {
  mysql: 'MySQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
};

const DashboardPage = (): ReactElement => {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'system-status'],
    queryFn: async () => (await getSystemStatus()).data,
    refetchInterval: 30000,
  });

  return (
    <div className="dashboard-page">
      <h2 className="dashboard-page__title font-title-large">시스템 모니터링</h2>
      <p className="dashboard-page__subtitle font-body-medium">30초마다 자동 갱신됩니다.</p>

      {isLoading || !data ? (
        <p className="dashboard-page__loading font-body-medium">불러오는 중...</p>
      ) : (
        <>
          <section className="dashboard-page__section">
            <h3 className="font-title-mini">서버 리소스</h3>
            <div className="dashboard-page__grid">
              <div className="stat-card">
                <span className="stat-card__label font-label-small">CPU</span>
                <span className="stat-card__value font-title-medium">
                  {data.server.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">메모리</span>
                <span className="stat-card__value font-title-medium">
                  {data.server.memory_usage.toFixed(1)}%
                </span>
                <span className="stat-card__hint font-label-small">
                  총 {(data.server.memory_total_mb / 1024).toFixed(1)}GB
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">디스크</span>
                <span className="stat-card__value font-title-medium">
                  {data.server.disk_usage.toFixed(1)}%
                </span>
              </div>
            </div>
          </section>

          <section className="dashboard-page__section">
            <h3 className="font-title-mini">API 통계 (최근 1시간)</h3>
            <div className="dashboard-page__grid">
              <div className="stat-card">
                <span className="stat-card__label font-label-small">요청 수</span>
                <span className="stat-card__value font-title-medium">
                  {data.api.total_requests_1h.toLocaleString()}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">평균 응답 시간</span>
                <span className="stat-card__value font-title-medium">
                  {data.api.avg_response_time_ms.toFixed(0)}ms
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label font-label-small">에러율</span>
                <span className="stat-card__value font-title-medium">
                  {data.api.error_rate_1h.toFixed(2)}%
                </span>
              </div>
            </div>
          </section>

          <section className="dashboard-page__section">
            <h3 className="font-title-mini">연결 상태</h3>
            <div className="dashboard-page__connections">
              {Object.entries(data.connections).map(([key, status]) => (
                <div key={key} className="connection-item">
                  <span className="font-label-medium">{CONNECTION_LABEL[key] ?? key}</span>
                  <StatusChip
                    label={status === 'ok' ? '정상' : '오류'}
                    tone={status === 'ok' ? 'accepted' : 'danger'}
                  />
                </div>
              ))}
            </div>
          </section>

          <p className="dashboard-page__checked font-label-small">
            마지막 조회: {new Date(dataUpdatedAt).toLocaleTimeString('ko-KR')}
          </p>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
