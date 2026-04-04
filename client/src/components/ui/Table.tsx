import type { ReactNode } from 'react';

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
}

const Table = ({
  columns,
  data,
  hoverable = true,
  striped = false,
  className = '',
}: TableProps) => {
  const alignClass = (align: string | undefined) => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  return (
    <div className={`border border-surface-200 rounded-lg overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide ${alignClass(column.align)}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-surface-500">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-surface-100 ${
                  hoverable ? 'hover:bg-surface-50 transition-colors' : ''
                } ${striped && rowIndex % 2 === 0 ? 'bg-surface-50' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column.key}`}
                    className={`px-6 py-4 text-sm text-surface-700 ${alignClass(column.align)}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
