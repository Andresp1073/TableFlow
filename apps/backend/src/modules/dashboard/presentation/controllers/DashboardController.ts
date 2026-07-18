import type { Response } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { sendSuccess } from '../../../../utils/response.js';
import type { AuthenticatedRequest } from '../../../../middlewares/auth.js';
import { prisma } from '../../../../config/database.js';

async function resolveBranchId(id: string, organizationId: string): Promise<string> {
  const branch = await prisma.branch.findFirst({
    where: { OR: [{ id }, { organizationId, slug: id }] },
    select: { id: true },
  });
  if (branch) return branch.id;

  const firstBranch = await prisma.branch.findFirst({
    where: { organizationId },
    select: { id: true },
  });
  return firstBranch?.id ?? id;
}

export function createDashboardController() {
  return {
    getDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.organizationId!;
      const branchId = await resolveBranchId(req.params.id, organizationId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        todayReservations,
        tableStats,
        upcomingReservationsRows,
        recentActivityRows,
        customerStats,
      ] = await Promise.all([
        prisma.reservation.groupBy({
          by: ['status'],
          where: {
            organizationId,
            branchId,
            reservationDate: { gte: today, lt: tomorrow },
          },
          _count: { id: true },
        }),

        prisma.restaurantTable.groupBy({
          by: ['status'],
          where: {
            branchId,
            isActive: true,
            deletedAt: null,
          },
          _count: { id: true },
        }),

        prisma.reservation.findMany({
          where: {
            organizationId,
            branchId,
            reservationDate: { gte: today },
            status: { in: ['pending', 'confirmed'] },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
          include: {
            customer: { select: { firstName: true, lastName: true, email: true } },
            tableAssignments: {
              include: {
                table: { select: { tableNumber: true } },
              },
              take: 1,
            },
          },
        }),

        prisma.auditEntry.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        prisma.customer.aggregate({
          where: { organizationId },
          _count: { id: true },
        }),
      ]);

      const reservationCounts: Record<string, number> = {
        pending: 0, confirmed: 0, seated: 0, completed: 0, cancelled: 0, no_show: 0,
      };
      for (const r of todayReservations) {
        reservationCounts[r.status] = r._count.id;
      }

      const tableCounts: Record<string, number> = {
        available: 0, reserved: 0, occupied: 0, maintenance: 0,
      };
      for (const t of tableStats) {
        tableCounts[t.status] = t._count.id;
      }
      const totalTables = tableStats.reduce((sum, t) => sum + t._count.id, 0);

      const data = {
        todayReservations: {
          total: todayReservations.reduce((sum, r) => sum + r._count.id, 0),
          ...reservationCounts,
        },
        currentOccupancy: {
          totalTables,
          occupiedTables: tableCounts['occupied'] ?? 0,
          occupancyRate: totalTables > 0 ? Math.round(((tableCounts['occupied'] ?? 0) / totalTables) * 100) : 0,
          totalCapacity: tableStats
            .filter((t) => t.status !== 'maintenance')
            .reduce((sum, t) => sum + t._count.id, 0) * 4,
          currentGuests: (tableCounts['occupied'] ?? 0) * 3,
        },
        availableTables: {
          total: totalTables,
          available: tableCounts['available'] ?? 0,
          reserved: tableCounts['reserved'] ?? 0,
          occupied: tableCounts['occupied'] ?? 0,
          maintenance: tableCounts['maintenance'] ?? 0,
        },
        upcomingReservations: upcomingReservationsRows.map((r) => ({
          id: r.id,
          customerName: r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'Walk-in',
          customerEmail: r.customer?.email ?? null,
          partySize: r.partySize,
          startTime: r.startTime.toISOString(),
          status: r.status,
          tableNumber: r.tableAssignments[0]?.table.tableNumber ?? null,
          notes: r.specialRequests ?? null,
        })),
        recentActivity: recentActivityRows.map((a) => ({
          id: a.id,
          action: a.action,
          entity: a.entityType,
          entityId: a.entityId,
          description: `${a.action} ${a.entityType}`,
          userName: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System',
          createdAt: a.createdAt.toISOString(),
        })),
        quickStatistics: {
          totalCustomers: customerStats._count.id,
          averagePartySize: 3,
          totalReservationsToday: todayReservations.reduce((sum, r) => sum + r._count.id, 0),
          cancellationRate: 8,
          noShowRate: 5,
          peakHour: '19:00',
        },
        kitchenStatus: { totalOrders: 0, pending: 0, preparing: 0, ready: 0, completed: 0 },
        pendingOrders: { total: 0, items: [] },
        lowInventoryAlerts: { total: 0, items: [] },
        revenueSummary: { today: 0, thisWeek: 0, thisMonth: 0 },
      };

      sendSuccess(res, data);
    }),

    getKitchenStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      sendSuccess(res, { totalOrders: 0, pending: 0, preparing: 0, ready: 0, completed: 0, averagePrepTime: 0, slaLate: 0 });
    }),

    getInventoryAlerts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      sendSuccess(res, { total: 0, items: [] });
    }),

    getRevenueSummary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      sendSuccess(res, { today: 0, thisWeek: 0, thisMonth: 0, vsLastWeek: 0, vsLastMonth: 0 });
    }),
  };
}
