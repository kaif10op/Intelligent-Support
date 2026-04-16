import type { ReactNode } from 'react';

interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: any) => ReactNode;
  width?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
  onRowClick?: (row: any) => void;
}

const Table = ({
  columns,
  data,
  hoverable = true,
  striped = false,
  className = '',
  onRowClick,
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
    <div className={`border overflow-hidden bg-card glass-lg ${className}`} style={{ borderColor: 'var(--glass-border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-surface-50/50" style={{ borderColor: 'var(--glass-border)' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-xs font-bold text-surface-500 uppercase tracking-[0.08em] ${alignClass(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-surface-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm font-medium">No results found</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-border/40 group transition-colors duration-200 ${
                    hoverable ? 'hover:bg-primary-500/5' : ''
                  } ${striped && rowIndex % 2 === 0 ? 'bg-surface-50/30' : ''} ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  style={rowIndex === data.length - 1 ? { borderBottom: 'none' } : {}}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={`px-5 py-4 text-sm text-surface-700 dark:text-surface-100 ${alignClass(column.align)}`}
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
    </div>
  );
};

export default Table;
