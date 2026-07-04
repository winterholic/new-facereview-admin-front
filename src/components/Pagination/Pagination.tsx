import type { ReactElement } from 'react';

import './pagination.scss';

interface PaginationProps {
  page: number;
  hasNext: boolean;
  total: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, hasNext, total, onChange }: PaginationProps): ReactElement => (
  <div className="pagination">
    <span className="pagination__total font-body-medium">전체 {total}건</span>
    <div className="pagination__controls">
      <button
        type="button"
        className="pagination__button font-label-small"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}>
        이전
      </button>
      <span className="pagination__page font-label-medium">{page}</span>
      <button
        type="button"
        className="pagination__button font-label-small"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}>
        다음
      </button>
    </div>
  </div>
);

export default Pagination;
