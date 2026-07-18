'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { RestaurantTable } from '@/lib/table-types';
import { TableCard } from './table-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Grid3X3,
  Hand,
  Pointer,
} from 'lucide-react';

interface FloorPlanCanvasProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  onMoveTable: (tableId: string, positionX: number, positionY: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  diningAreaName?: string;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const GRID_SIZE = 20;
const CANVAS_SIZE = 3000;

export function FloorPlanCanvas({
  tables,
  selectedTableId,
  onSelectTable,
  onMoveTable,
  isLoading = false,
  readOnly = false,
  diningAreaName,
}: FloorPlanCanvasProps) {
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: -CANVAS_SIZE / 2 + 400, y: -CANVAS_SIZE / 2 + 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');
  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPanOffset({ x: -CANVAS_SIZE / 2 + 400, y: -CANVAS_SIZE / 2 + 300 });
    onSelectTable(null);
  }, [onSelectTable]);

  const fitToContent = useCallback(() => {
    if (tables.length === 0) {
      resetView();
      return;
    }

    const padding = 100;
    const minX = Math.min(...tables.map((t) => t.positionX ?? 0));
    const minY = Math.min(...tables.map((t) => t.positionY ?? 0));
    const maxX = Math.max(...tables.map((t) => (t.positionX ?? 0) + t.width));
    const maxY = Math.max(...tables.map((t) => (t.positionY ?? 0) + t.height));

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const containerWidth = canvasRef.current?.clientWidth ?? 800;
    const containerHeight = canvasRef.current?.clientHeight ?? 600;

    const fitScale = Math.min(
      containerWidth / contentWidth,
      containerHeight / contentHeight,
      1.5,
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(Math.max(fitScale, MIN_ZOOM));
    setPanOffset({
      x: -centerX * fitScale + containerWidth / 2,
      y: -centerY * fitScale + containerHeight / 2,
    });
  }, [tables, resetView]);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (toolMode === 'pan' || (e.target === canvasRef.current || (e.target as HTMLElement).dataset?.['canvas'] === 'true')) {
      if (!readOnly) {
        setIsPanning(true);
        panRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          offsetX: panOffset.x,
          offsetY: panOffset.y,
        };
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
      }
    } else if (toolMode === 'select') {
      onSelectTable(null);
    }
  }, [toolMode, panOffset, onSelectTable, readOnly]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning && !readOnly) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setPanOffset({
        x: panRef.current.offsetX + dx,
        y: panRef.current.offsetY + dy,
      });
    }
  }, [isPanning, readOnly]);

  const handleCanvasPointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale + delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setPanOffset((prev) => ({
        x: mouseX - ((mouseX - prev.x) / scale) * newScale,
        y: mouseY - ((mouseY - prev.y) / scale) * newScale,
      }));
    }
    setScale(newScale);
  }, [scale]);

  const handleSelectTable = useCallback((tableId: string) => {
    onSelectTable(tableId === selectedTableId ? null : tableId);
  }, [selectedTableId, onSelectTable]);

  const handleDragStart = useCallback(() => {
    setIsDraggingTable(true);
  }, []);

  const handleDragEnd = useCallback((tableId: string, x: number, y: number) => {
    setIsDraggingTable(false);
    onMoveTable(tableId, x, y);
  }, [onMoveTable]);

  const gridLines = useMemo(() => {
    if (!showGrid) return null;
    const lines: React.ReactNode[] = [];
    const spacing = GRID_SIZE;
    for (let x = 0; x <= CANVAS_SIZE; x += spacing) {
      lines.push(
        <line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_SIZE}
          stroke="hsl(var(--border))"
          strokeWidth={x % (spacing * 5) === 0 ? 0.5 : 0.25}
          opacity={x % (spacing * 5) === 0 ? 0.5 : 0.2}
        />,
      );
    }
    for (let y = 0; y <= CANVAS_SIZE; y += spacing) {
      lines.push(
        <line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={CANVAS_SIZE}
          y2={y}
          stroke="hsl(var(--border))"
          strokeWidth={y % (spacing * 5) === 0 ? 0.5 : 0.25}
          opacity={y % (spacing * 5) === 0 ? 0.5 : 0.2}
        />,
      );
    }
    return lines;
  }, [showGrid]);

  const activeTables = useMemo(() => tables.filter((t) => t.isActive), [tables]);
  const nonActiveTables = useMemo(() => tables.filter((t) => !t.isActive), [tables]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTableId && (e.key === 'Delete' || e.key === 'Backspace')) {
        return;
      }
      if (e.key === 'g') setShowGrid((v) => !v);
      if (e.key === 'f') fitToContent();
      if (e.key === 'r') resetView();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTableId, fitToContent, resetView]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
        <div className="flex items-center gap-2">
          {diningAreaName && (
            <span className="text-sm font-medium text-muted-foreground mr-2">
              {diningAreaName}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {activeTables.length} {activeTables.length === 1 ? t('table') : t('tables')}
          </span>
        </div>
        <div className="flex items-center gap-1" role="toolbar" aria-label={t('Floor plan tools')}>
          <Button
            variant={toolMode === 'select' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setToolMode('select')}
            aria-label={t('Select mode')}
            aria-pressed={toolMode === 'select'}
            title={t('Select (V)')}
          >
            <Pointer className="h-4 w-4" />
          </Button>
          <Button
            variant={toolMode === 'pan' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setToolMode('pan')}
            aria-label={t('Pan mode')}
            aria-pressed={toolMode === 'pan'}
            title={t('Pan (H)')}
          >
            <Hand className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowGrid((v) => !v)}
            aria-label={showGrid ? t('Hide grid') : t('Show grid')}
            aria-pressed={showGrid}
            title={t('Toggle Grid (G)')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            aria-label={t('Zoom out')}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums w-10 text-center" aria-label={t('Zoom {percent}%', { percent: Math.round(scale * 100) })}>
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            aria-label={t('Zoom in')}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fitToContent}
            aria-label={t('Fit to screen')}
            title={t('Fit (F)')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={resetView}
            aria-label={t('Reset view')}
            title={t('Reset (R)')}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-muted/20">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">{t('Loading floor plan...')}</span>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">{t('No tables in this area')}</p>
              <p className="text-xs text-muted-foreground">
                {t('Create a table to get started')}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={canvasRef}
            className={cn(
              'w-full h-full relative overflow-hidden',
              toolMode === 'pan' && !readOnly && 'cursor-grab',
              isPanning && 'cursor-grabbing',
              toolMode === 'select' && !isDraggingTable && !readOnly && 'cursor-default',
            )}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onWheel={handleWheel}
            role="application"
            aria-label={t('Floor plan editor')}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                position: 'absolute',
                left: 0,
                top: 0,
              }}
            >
              <svg
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              >
                {gridLines}
              </svg>

              {nonActiveTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  scale={scale}
                  isSelected={selectedTableId === table.id}
                  onSelect={handleSelectTable}
                  readOnly
                />
              ))}

              {activeTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  scale={scale}
                  isSelected={selectedTableId === table.id}
                  onSelect={handleSelectTable}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedTableId && (
        <div className="border-t px-4 py-2 bg-background">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {tables.find((t) => t.id === selectedTableId)?.tableNumber
                ? t('Table {tableNumber} selected', { tableNumber: tables.find((t) => t.id === selectedTableId)!.tableNumber })
                : t('Table selected')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
