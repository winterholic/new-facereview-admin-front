import type { ReactElement, ReactNode } from 'react';

import './dataTable.scss';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  isLoading,
  emptyMessage = '데이터가 없습니다.',
}: DataTableProps<T>): ReactElement => (
  <div className="data-table">
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
              className="font-label-small">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={columns.length} className="data-table__state font-body-medium">
              불러오는 중...
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="data-table__state font-body-medium">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className="font-body-medium">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
