/**
 * CSV Export Utilities
 */

export interface CSVExportOptions {
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  filename?: string;
}

/**
 * Escape CSV field value
 */
const escapeCSVField = (value: any): string => {
  if (value === null || value === undefined) return '';

  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generate CSV content from data
 */
export const generateCSV = (options: CSVExportOptions): string => {
  const { headers, rows } = options;

  const escapedHeaders = headers.map(escapeCSVField).join(',');
  const escapedRows = rows.map(row =>
    row.map(escapeCSVField).join(',')
  ).join('\n');

  return `${escapedHeaders}\n${escapedRows}`;
};

/**
 * Export chats to CSV
 */
export const exportChatsToCSV = (chats: any[]): string => {
  const headers = ['ID', 'Title', 'KB', 'Messages', 'Created', 'Updated'];
  const rows = chats.map(chat => [
    chat.id,
    chat.title || 'Untitled',
    chat.kb?.title || 'N/A',
    chat.messages?.length || 0,
    new Date(chat.createdAt).toLocaleString(),
    new Date(chat.updatedAt).toLocaleString()
  ]);

  return generateCSV({ headers, rows, filename: 'chats.csv' });
};

/**
 * Export tickets to CSV
 */
export const exportTicketsToCSV = (tickets: any[]): string => {
  const headers = ['ID', 'Title', 'Status', 'Priority', 'User', 'Assigned To', 'Due Date', 'Overdue', 'Created'];
  const rows = tickets.map(ticket => [
    ticket.id,
    ticket.title,
    ticket.status,
    ticket.priority,
    ticket.user?.name || 'N/A',
    ticket.assignedTo?.name || 'Unassigned',
    ticket.dueAt ? new Date(ticket.dueAt).toLocaleDateString() : 'N/A',
    ticket.isOverdue ? 'Yes' : 'No',
    new Date(ticket.createdAt).toLocaleString()
  ]);

  return generateCSV({ headers, rows, filename: 'tickets.csv' });
};

/**
 * Export tickets with messages to CSV
 */
export const exportTicketsWithMessagesToCSV = (tickets: any[]): string => {
  const headers = ['Ticket ID', 'Title', 'Status', 'Priority', 'User', 'Message Count', 'Created'];
  const rows: any[] = [];

  tickets.forEach(ticket => {
    rows.push([
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority,
      ticket.user?.name || 'N/A',
      ticket.notes?.length || 0,
      new Date(ticket.createdAt).toLocaleString()
    ]);
  });

  return generateCSV({ headers, rows, filename: 'tickets-detailed.csv' });
};

/**
 * Create downloadable CSV file as Blob
 */
export const createCSVBlob = (csvContent: string): Blob => {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
};

/**
 * Generate download filename with timestamp
 */
export const getExportFilename = (prefix: string): string => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${timestamp}.csv`;
};
