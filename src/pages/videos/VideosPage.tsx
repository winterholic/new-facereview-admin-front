import { useState } from 'react';
import type { ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getVideos, deleteVideo } from 'api/admin';
import type { AdminVideo } from 'types';
import DataTable from 'components/DataTable/DataTable';
import type { DataTableColumn } from 'components/DataTable/DataTable';
import Pagination from 'components/Pagination/Pagination';
import StatusChip from 'components/StatusChip/StatusChip';
import TextInput from 'components/TextInput/TextInput';
import ConfirmModal from 'components/ConfirmModal/ConfirmModal';

import './videosPage.scss';

const CATEGORY_OPTIONS = [
  'drama',
  'eating',
  'travel',
  'cook',
  'show',
  'information',
  'game',
  'sports',
  'music',
  'animal',
  'beauty',
  'comedy',
  'horror',
  'exercise',
  'vlog',
  'etc',
];

const VideosPage = (): ReactElement => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminVideo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'videos', { keyword, category, page }],
    queryFn: async () =>
      (
        await getVideos({
          keyword: keyword || undefined,
          category: category || undefined,
          page,
          size: 20,
        })
      ).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (videoId: string) => deleteVideo(videoId),
    onSuccess: () => {
      toast.success('영상을 삭제했습니다.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'videos'] });
    },
    onError: () => toast.error('영상 삭제에 실패했습니다.'),
  });

  const columns: DataTableColumn<AdminVideo>[] = [
    { key: 'title', header: '제목', render: (row) => row.title },
    { key: 'channel_name', header: '채널명', render: (row) => row.channel_name },
    { key: 'category', header: '카테고리', render: (row) => row.category },
    {
      key: 'duration',
      header: '길이',
      render: (row) =>
        `${Math.floor(row.duration / 60)}:${String(row.duration % 60).padStart(2, '0')}`,
    },
    { key: 'view_count', header: '조회수', render: (row) => row.view_count.toLocaleString() },
    { key: 'like_count', header: '좋아요', render: (row) => row.like_count.toLocaleString() },
    {
      key: 'comment_count',
      header: '댓글',
      render: (row) => row.comment_count.toLocaleString(),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => (
        <StatusChip
          label={row.is_deleted ? '삭제됨' : '정상'}
          tone={row.is_deleted ? 'danger' : 'accepted'}
        />
      ),
    },
    {
      key: 'actions',
      header: '관리',
      render: (row) => (
        <button
          type="button"
          className="videos-page__action-button font-label-small"
          disabled={row.is_deleted}
          onClick={() => setDeleteTarget(row)}>
          삭제
        </button>
      ),
    },
  ];

  return (
    <div className="videos-page">
      <h2 className="font-title-large">영상 관리</h2>

      <div className="videos-page__filters">
        <TextInput
          placeholder="제목 또는 채널명 검색"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="videos-page__select font-body-medium"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}>
          <option value="">전체 카테고리</option>
          {CATEGORY_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.videos ?? []}
        rowKey={(row) => row.video_id}
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
        isOpen={Boolean(deleteTarget)}
        title="영상 삭제"
        description={`"${deleteTarget?.title}" 영상을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        danger
        isSubmitting={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.video_id);
        }}
      />
    </div>
  );
};

export default VideosPage;
