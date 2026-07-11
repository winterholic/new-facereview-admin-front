import { useState } from 'react';
import type { ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getUsers, deactivateUser, changeUserRole } from 'api/admin';
import type { AdminUser } from 'types';
import DataTable from 'components/DataTable/DataTable';
import type { DataTableColumn } from 'components/DataTable/DataTable';
import Pagination from 'components/Pagination/Pagination';
import StatusChip from 'components/StatusChip/StatusChip';
import TextInput from 'components/TextInput/TextInput';
import ConfirmModal from 'components/ConfirmModal/ConfirmModal';
import { useAuthStore } from 'store/authStore';

import './usersPage.scss';

const DEACTIVATED_FILTER_OPTIONS = [
  { label: '전체', value: '' },
  { label: '활성 회원만', value: 'false' },
  { label: '탈퇴 회원만', value: 'true' },
] as const;

const UsersPage = (): ReactElement => {
  const queryClient = useQueryClient();
  const isSuperAdmin = useAuthStore((state) => state.role === 'SUPER_ADMIN');
  const [keyword, setKeyword] = useState('');
  const [isDeletedFilter, setIsDeletedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);

  const queryKey = ['admin', 'users', { keyword, isDeletedFilter, page }];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () =>
      (
        await getUsers({
          keyword: keyword || undefined,
          is_deleted: isDeletedFilter === '' ? undefined : isDeletedFilter === 'true',
          page,
          size: 10,
        })
      ).data,
  });

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      toast.success('회원을 비활성화했습니다.');
      setDeactivateTarget(null);
      invalidateUsers();
    },
    onError: () => toast.error('비활성화에 실패했습니다.'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'GENERAL' | 'ADMIN' }) =>
      changeUserRole(userId, role),
    onSuccess: () => {
      toast.success('권한을 변경했습니다.');
      invalidateUsers();
    },
    onError: () => toast.error('권한 변경에 실패했습니다.'),
  });

  const columns: DataTableColumn<AdminUser>[] = [
    { key: 'name', header: '이름', render: (row) => row.name },
    { key: 'email', header: '이메일', render: (row) => row.email },
    {
      key: 'role',
      header: '권한',
      render: (row) => (
        <StatusChip
          label={row.role}
          tone={row.role === 'SUPER_ADMIN' ? 'super' : row.role === 'ADMIN' ? 'brand' : 'neutral'}
        />
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (row) => (
        <StatusChip
          label={row.is_deleted ? '탈퇴' : '활성'}
          tone={row.is_deleted ? 'danger' : 'accepted'}
        />
      ),
    },
    { key: 'watch', header: '시청 수', render: (row) => row.total_watch_count },
    { key: 'comment', header: '댓글 수', render: (row) => row.total_comment_count },
    {
      key: 'created_at',
      header: '가입일',
      render: (row) => new Date(row.created_at).toLocaleDateString('ko-KR'),
    },
    {
      key: 'actions',
      header: '관리',
      render: (row) => (
        <div className="users-page__actions">
          {(isSuperAdmin || row.role === 'GENERAL') && (
            <button
              type="button"
              className="users-page__action-button font-label-small"
              disabled={row.is_deleted}
              onClick={() => setDeactivateTarget(row)}>
              비활성화
            </button>
          )}
          {isSuperAdmin && row.role !== 'SUPER_ADMIN' && (
            <button
              type="button"
              className="users-page__action-button font-label-small"
              onClick={() =>
                roleMutation.mutate({
                  userId: row.user_id,
                  role: row.role === 'ADMIN' ? 'GENERAL' : 'ADMIN',
                })
              }>
              {row.role === 'ADMIN' ? 'ADMIN 해제' : 'ADMIN 지정'}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <h2 className="font-title-large">회원 관리</h2>

      <div className="users-page__filters">
        <TextInput
          placeholder="이름 또는 이메일 검색"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="users-page__select font-body-medium"
          value={isDeletedFilter}
          onChange={(event) => {
            setIsDeletedFilter(event.target.value);
            setPage(1);
          }}>
          {DEACTIVATED_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.users ?? []}
        rowKey={(row) => row.user_id}
        isLoading={isLoading}
      />

      {data && (
        <Pagination
          page={data.page}
          hasNext={data.has_next}
          total={data.total}
          pageSize={10}
          onChange={setPage}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deactivateTarget)}
        title="회원 비활성화"
        description={`${deactivateTarget?.name} (${deactivateTarget?.email}) 님을 비활성화하시겠습니까?`}
        confirmLabel="비활성화"
        danger
        isSubmitting={deactivateMutation.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.user_id);
        }}
      />
    </div>
  );
};

export default UsersPage;
