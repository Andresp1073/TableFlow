'use client';

import { useState, useCallback } from 'react';
import { Download, FileJson, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExportConfig } from '@/lib/analytics-types';

interface ExportButtonProps {
  config: ExportConfig;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

function convertToCSV(data: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val ?? '');
    }).join(','),
  );
  return [header, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportButton({ config, variant = 'outline', size = 'sm', label = 'Export' }: ExportButtonProps) {
  const handleExportCSV = useCallback(() => {
    const csv = convertToCSV(config.data, config.columns);
    downloadFile(csv, `${config.filename}.csv`, 'text/csv;charset=utf-8;');
  }, [config]);

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(config.data, null, 2);
    downloadFile(json, `${config.filename}.json`, 'application/json;charset=utf-8;');
  }, [config]);

  const handlePrint = useCallback(() => {
    const tableHtml = `
      <html>
        <head><title>${config.filename}</title></head>
        <body>
          <h1>${config.filename}</h1>
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:system-ui;">
            <thead>
              <tr>${config.columns.map((c) => `<th style="background:#f5f5f5;text-align:left;">${c.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${config.data.map((row) =>
                `<tr>${config.columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(tableHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  }, [config]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} aria-label={`Export ${config.filename}`}>
          <Download className="h-4 w-4 mr-1" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
