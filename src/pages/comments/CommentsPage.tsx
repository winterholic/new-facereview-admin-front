import { useState } from 'react';
import type { ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getComments, deleteComment } from 'api/admin';
import type { AdminComment } from 'types';
import DataTable from 'components/DataTable/DataTable';
import type { DataTableColumn } from 'components/DataTable/DataTable';
import Pagination from 'components/Pagination/Pagination';
import StatusChip from 'components/StatusChip/StatusChip';
import TextInput from 'components/TextInput/TextInput';
import ConfirmModal from 'components/ConfirmModal/ConfirmModal';

import './commentsPage.scss';

const DELETED_FILTER_OPTIONS = [
  { label: '전체', value: '' },
  { label: '정상 댓글만', value: 'false' },
  { label: '삭제 댓글만', value: 'true' },
] as const;

const CommentsPage = (): ReactElement => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [isDeletedFilter, setIsDeletedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminComment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'comments', { keyword, isDeletedFilter, page }],
    queryFn: async () =>
      (
        await getComments({
          keyword: keyword || undefined,
          is_deleted: isDeletedFilter === '' ? undefined : isDeletedFilter === 'true',
          page,
          size: 20,
        })
      ).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      toast.success('댓글을 삭제했습니다.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
    onError: () => toast.error('댓글 삭제에 실패했습니다.'),
  });

  const columns: DataTableColumn<AdminComment>[] = [
    { key: 'user_name', header: '작성자', render: (row) => row.user_name },
    { key: 'video_title', header: '영상', render: (row) => row.video_title },
    { key: 'content', header: '내용', render: (row) => row.content },
    {
      key: 'is_modified',
      header: '수정됨',
      render: (row) => (row.is_modified ? '예' : '아니오'),
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
      key: 'created_at',
      header: '작성일',
      render: (row) => new Date(row.created_at).toLocaleDateString('ko-KR'),
    },
    {
      key: 'actions',
      header: '관리',
      render: (row) => (
        <button
          type="button"
          className="comments-page__action-button font-label-small"
          disabled={row.is_deleted}
          onClick={() => setDeleteTarget(row)}>
          삭제
        </button>
      ),
    },
  ];

  return (
    <div className="comments-page">
      <h2 className="font-title-large">댓글 관리</h2>

      <div className="comments-page__filters">
        <TextInput
          placeholder="댓글 내용 검색"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="comments-page__select font-body-medium"
          value={isDeletedFilter}
          onChange={(event) => {
            setIsDeletedFilter(event.target.value);
            setPage(1);
          }}>
          {DELETED_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.comments ?? []}
        rowKey={(row) => row.comment_id}
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
        title="댓글 삭제"
        description={deleteTarget?.content}
        confirmLabel="삭제"
        danger
        isSubmitting={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.comment_id);
        }}
      />
    </div>
  );
};

export default CommentsPage;
