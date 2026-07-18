'use client';

import { useCallback, useRef } from 'react';
import type { RestaurantTable, TableShape } from '@/lib/table-types';
import { TABLE_STATUS_COLORS, TABLE_STATUS_LABELS } from '@/lib/table-types';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface TableCardProps {
  table: RestaurantTable;
  isSelected?: boolean;
  scale?: number;
  onSelect?: (tableId: string) => void;
  onDragStart?: (tableId: string) => void;
  onDragMove?: (tableId: string, x: number, y: number) => void;
  onDragEnd?: (tableId: string, x: number, y: number) => void;
  readOnly?: boolean;
}

function getShapePath(
  shape: TableShape,
  width: number,
  height: number,
): { path: string; viewBox: string } {
  const w = Math.max(width, 40);
  const h = Math.max(height, 40);
  const halfW = w / 2;
  const halfH = h / 2;

  switch (shape) {
    case 'round':
      return {
        path: `<circle cx="${halfW}" cy="${halfH}" r="${Math.min(halfW, halfH) - 2}" />`,
        viewBox: `0 0 ${w} ${h}`,
      };
    case 'oval':
      return {
        path: `<ellipse cx="${halfW}" cy="${halfH}" rx="${halfW - 2}" ry="${halfH - 2}" />`,
        viewBox: `0 0 ${w} ${h}`,
      };
    case 'square':
      return {
        path: `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" />`,
        viewBox: `0 0 ${w} ${h}`,
      };
    case 'rectangle':
    default:
      return {
        path: `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" />`,
        viewBox: `0 0 ${w} ${h}`,
      };
  }
}

export function TableCard({
  table,
  isSelected = false,
  scale = 1,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  readOnly = false,
}: TableCardProps) {
  const dragRef = useRef<{ startX: number; startY: number; tableStartX: number; tableStartY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    tableStartX: 0,
    tableStartY: 0,
    isDragging: false,
  });

  const positionX = table.positionX ?? 0;
  const positionY = table.positionY ?? 0;
  const rotation = table.rotation ?? 0;
  const color = TABLE_STATUS_COLORS[table.status];
  const { path: shapePath, viewBox } = getShapePath(table.shape, table.width, table.height);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      tableStartX: positionX,
      tableStartY: positionY,
      isDragging: false,
    };

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - dragRef.current.startX) / scale;
      const dy = (ev.clientY - dragRef.current.startY) / scale;
      const gridSnap = 10;
      const newX = Math.round((dragRef.current.tableStartX + dx) / gridSnap) * gridSnap;
      const newY = Math.round((dragRef.current.tableStartY + dy) / gridSnap) * gridSnap;

      if (!dragRef.current.isDragging) {
        dragRef.current.isDragging = true;
        onDragStart?.(table.id);
      }

      onDragMove?.(table.id, newX, newY);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);

      if (dragRef.current.isDragging) {
        const dx = (ev.clientX - dragRef.current.startX) / scale;
        const dy = (ev.clientY - dragRef.current.startY) / scale;
        const gridSnap = 10;
        const finalX = Math.round((dragRef.current.tableStartX + dx) / gridSnap) * gridSnap;
        const finalY = Math.round((dragRef.current.tableStartY + dy) / gridSnap) * gridSnap;
        onDragEnd?.(table.id, finalX, finalY);
      } else {
        onSelect?.(table.id);
      }
    };

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
  }, [positionX, positionY, scale, readOnly, table.id, onSelect, onDragStart, onDragMove, onDragEnd]);

  const capacityDisplay = table.minimumCapacity === table.maximumCapacity
    ? `${table.minimumCapacity}`
    : `${table.minimumCapacity}-${table.maximumCapacity}`;

  return (
    <div
      className={cn(
        'absolute select-none',
        isSelected && 'z-10',
      )}
      style={{
        left: positionX,
        top: positionY,
        width: table.width,
        height: table.height,
        transform: `rotate(${rotation}deg)`,
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        handlePointerDown(e);
      }}
      role="button"
      tabIndex={0}
      aria-label={t('Table {tableNumber}, {status}, capacity {capacity}', { tableNumber: table.tableNumber, status: TABLE_STATUS_LABELS[table.status], capacity: capacityDisplay })}
      data-selected={isSelected ? 'true' : 'false'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(table.id);
        }
      }}
    >
      <svg
        viewBox={viewBox}
        width={table.width}
        height={table.height}
        className={cn(
          'overflow-visible drop-shadow-sm transition-shadow duration-150',
          isSelected && 'drop-shadow-md',
          !readOnly && 'cursor-grab active:cursor-grabbing',
        )}
        aria-hidden="true"
      >
        <g
          dangerouslySetInnerHTML={{ __html: shapePath }}
          fill={isSelected ? `${color}20` : `${color}15`}
          stroke={isSelected ? color : `${color}60`}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
        {table.shape !== 'round' && table.shape !== 'oval' && (
          <line
            x1={table.width / 2 - 8}
            y1={4}
            x2={table.width / 2 + 8}
            y2={4}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.5}
          />
        )}
      </svg>

      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1',
        )}
      >
        <span
          className="font-semibold leading-tight text-center"
          style={{
            fontSize: Math.max(9, Math.min(14, table.width / 6)),
            color,
          }}
        >
          {table.tableNumber}
        </span>
        <span
          className="leading-tight text-center opacity-70"
          style={{
            fontSize: Math.max(7, Math.min(11, table.width / 8)),
            color,
          }}
        >
          {capacityDisplay}
        </span>
      </div>

      {table.name && (
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
        >
          <span
            className="text-xs text-muted-foreground truncate block max-w-[120px] text-center"
            style={{ fontSize: Math.max(8, Math.min(11, table.width / 7)) }}
          >
            {table.name}
          </span>
        </div>
      )}
    </div>
  );
}
