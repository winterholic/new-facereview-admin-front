import { useState } from 'react';
import type { ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getVideoRequests, approveVideoRequest, rejectVideoRequest } from 'api/admin';
import type { AdminVideoRequest, VideoRequestStatus } from 'types';
import DataTable from 'components/DataTable/DataTable';
import type { DataTableColumn } from 'components/DataTable/DataTable';
import Pagination from 'components/Pagination/Pagination';
import StatusChip from 'components/StatusChip/StatusChip';
import TextInput from 'components/TextInput/TextInput';
import ConfirmModal from 'components/ConfirmModal/ConfirmModal';

import './videoRequestsPage.scss';

const STATUS_OPTIONS: { label: string; value: VideoRequestStatus | '' }[] = [
  { label: '전체', value: '' },
  { label: '대기중', value: 'PENDING' },
  { label: '승인됨', value: 'ACCEPTED' },
  { label: '거절됨', value: 'REJECTED' },
];

const STATUS_CHIP: Record<VideoRequestStatus, { label: string; tone: 'pending' | 'accepted' | 'rejected' }> = {
  PENDING: { label: '대기중', tone: 'pending' },
  ACCEPTED: { label: '승인됨', tone: 'accepted' },
  REJECTED: { label: '거절됨', tone: 'rejected' },
};

const VideoRequestsPage = (): ReactElement => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<VideoRequestStatus | ''>('');
  const [page, setPage] = useState(1);

  const [approveTarget, setApproveTarget] = useState<AdminVideoRequest | null>(null);
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');

  const [rejectTarget, setRejectTarget] = useState<AdminVideoRequest | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'video-requests', { status, page }],
    queryFn: async () =>
      (await getVideoRequests({ status: status || undefined, page, size: 20 })).data,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'video-requests'] });

  const approveMutation = useMutation({
    mutationFn: () =>
      approveVideoRequest(approveTarget!.video_request_id, {
        youtube_title: youtubeTitle,
        channel_name: channelName,
        duration: Number(durationSeconds),
      }),
    onSuccess: () => {
      toast.success('영상 요청을 승인했습니다.');
      closeApproveModal();
      invalidate();
    },
    onError: () => toast.error('승인에 실패했습니다.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectVideoRequest(rejectTarget!.video_request_id, rejectComment),
    onSuccess: () => {
      toast.success('영상 요청을 거절했습니다.');
      closeRejectModal();
      invalidate();
    },
    onError: () => toast.error('거절 처리에 실패했습니다.'),
  });

  const openApproveModal = (row: AdminVideoRequest) => {
    setApproveTarget(row);
    setYoutubeTitle('');
    setChannelName('');
    setDurationSeconds('');
  };
  const closeApproveModal = () => setApproveTarget(null);

  const openRejectModal = (row: AdminVideoRequest) => {
    setRejectTarget(row);
    setRejectComment('');
  };
  const closeRejectModal = () => setRejectTarget(null);

  const columns: DataTableColumn<AdminVideoRequest>[] = [
    { key: 'user_name', header: '요청자', render: (row) => row.user_name },
    {
      key: 'youtube_url',
      header: '유튜브 링크',
      render: (row) => (
        <a
          href={row.youtube_full_url}
          target="_blank"
          rel="noreferrer"
          className="video-requests-page__link">
          {row.youtube_url}
        </a>
      ),
    },
    { key: 'category', header: '카테고리', render: (row) => row.category },
    {
      key: 'status',
      header: '상태',
      render: (row) => (
        <StatusChip label={STATUS_CHIP[row.status].label} tone={STATUS_CHIP[row.status].tone} />
      ),
    },
    {
      key: 'created_at',
      header: '요청일',
      render: (row) => new Date(row.created_at).toLocaleDateString('ko-KR'),
    },
    {
      key: 'actions',
      header: '관리',
      render: (row) =>
        row.status === 'PENDING' ? (
          <div className="video-requests-page__actions">
            <button
              type="button"
              className="video-requests-page__action-button video-requests-page__action-button--approve font-label-small"
              onClick={() => openApproveModal(row)}>
              승인
            </button>
            <button
              type="button"
              className="video-requests-page__action-button font-label-small"
              onClick={() => openRejectModal(row)}>
              거절
            </button>
          </div>
        ) : (
          <span className="video-requests-page__comment font-label-small">
            {row.admin_comment}
          </span>
        ),
    },
  ];

  return (
    <div className="video-requests-page">
      <h2 className="font-title-large">영상 요청 관리</h2>

      <div className="video-requests-page__filters">
        <select
          className="video-requests-page__select font-body-medium"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as VideoRequestStatus | '');
            setPage(1);
          }}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.requests ?? []}
        rowKey={(row) => row.video_request_id}
        isLoading={isLoading}
      />

      {data && (
        <Pagination
          page={data.page}
          hasNext={data.has_next}
          total={data.total}
          onChange={setPage}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(approveTarget)}
        title="영상 요청 승인"
        description={approveTarget?.youtube_full_url}
        confirmLabel="승인"
        isSubmitting={approveMutation.isPending}
        onCancel={closeApproveModal}
        onConfirm={() => approveMutation.mutate()}>
        <TextInput
          label="영상 제목"
          value={youtubeTitle}
          onChange={(event) => setYoutubeTitle(event.target.value)}
        />
        <TextInput
          label="채널명"
          value={channelName}
          onChange={(event) => setChannelName(event.target.value)}
        />
        <TextInput
          label="영상 길이 (초)"
          type="number"
          min={1}
          value={durationSeconds}
          onChange={(event) => setDurationSeconds(event.target.value)}
        />
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        title="영상 요청 거절"
        description={rejectTarget?.youtube_full_url}
        confirmLabel="거절"
        danger
        isSubmitting={rejectMutation.isPending}
        onCancel={closeRejectModal}
        onConfirm={() => rejectMutation.mutate()}>
        <TextInput
          label="거절 사유"
          value={rejectComment}
          onChange={(event) => setRejectComment(event.target.value)}
        />
      </ConfirmModal>
    </div>
  );
};

export default VideoRequestsPage;
