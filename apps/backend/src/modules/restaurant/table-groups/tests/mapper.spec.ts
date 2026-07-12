import { describe, it, expect } from "vitest";
import { TableGroupMapper } from "../application/dto/TableGroupMapper.js";
import type { TableGroup } from "../domain/models/TableGroup.js";
import { TableGroupId } from "../domain/models/TableGroupId.js";
import { TableGroupName } from "../domain/models/TableGroupName.js";
import { TableGroupStatus } from "../domain/models/TableGroupStatus.js";
import { DisplayOrder } from "../domain/models/DisplayOrder.js";

function createTestGroup(overrides?: Partial<TableGroup>): TableGroup {
  return {
    id: TableGroupId.reconstitute("550e8400-e29b-41d4-a716-446655440000"),
    restaurantId: "rest-1",
    name: TableGroupName.create("Test Group"),
    description: "A test group",
    status: TableGroupStatus.create("active"),
    isActive: true,
    createdBy: "user-1",
    members: [
      { tableId: "table-1", displayOrder: DisplayOrder.create(1), joinedAt: new Date("2026-01-01") },
      { tableId: "table-2", displayOrder: DisplayOrder.create(2), joinedAt: new Date("2026-01-01") },
    ],
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T11:00:00Z"),
    releasedAt: null,
    ...overrides,
  };
}

describe("TableGroupMapper", () => {
  describe("toDTO", () => {
    it("maps full domain to DTO", () => {
      const group = createTestGroup();
      const dto = TableGroupMapper.toDTO(group);

      expect(dto.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(dto.restaurantId).toBe("rest-1");
      expect(dto.name).toBe("Test Group");
      expect(dto.description).toBe("A test group");
      expect(dto.status).toBe("active");
      expect(dto.isActive).toBe(true);
      expect(dto.members).toHaveLength(2);
      expect(dto.releasedAt).toBeNull();
    });

    it("maps members correctly", () => {
      const group = createTestGroup();
      const dto = TableGroupMapper.toDTO(group);

      expect(dto.members[0].tableId).toBe("table-1");
      expect(dto.members[0].displayOrder).toBe(1);
      expect(dto.members[1].tableId).toBe("table-2");
      expect(dto.members[1].displayOrder).toBe(2);
    });

    it("maps releasedAt when set", () => {
      const group = createTestGroup({
        status: TableGroupStatus.create("released"),
        releasedAt: new Date("2026-01-02T10:00:00Z"),
      });
      const dto = TableGroupMapper.toDTO(group);

      expect(dto.status).toBe("released");
      expect(dto.releasedAt).toBe("2026-01-02T10:00:00.000Z");
    });

    it("maps null description", () => {
      const group = createTestGroup({ description: null });
      const dto = TableGroupMapper.toDTO(group);

      expect(dto.description).toBeNull();
    });

    it("serializes dates to ISO strings", () => {
      const group = createTestGroup();
      const dto = TableGroupMapper.toDTO(group);

      expect(dto.createdAt).toBe("2026-01-01T10:00:00.000Z");
      expect(dto.updatedAt).toBe("2026-01-01T11:00:00.000Z");
    });
  });

  describe("toSummary", () => {
    it("maps domain to summary", () => {
      const group = createTestGroup();
      const summary = TableGroupMapper.toSummary(group);

      expect(summary.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(summary.name).toBe("Test Group");
      expect(summary.description).toBe("A test group");
      expect(summary.status).toBe("active");
      expect(summary.isActive).toBe(true);
      expect(summary.memberCount).toBe(2);
    });
  });

  describe("toDTOList", () => {
    it("maps multiple groups", () => {
      const groups = [createTestGroup(), createTestGroup({ name: TableGroupName.create("Group 2") })];
      const dtos = TableGroupMapper.toDTOList(groups);

      expect(dtos).toHaveLength(2);
      expect(dtos[1].name).toBe("Group 2");
    });
  });

  describe("toSummaryList", () => {
    it("maps multiple groups to summaries", () => {
      const groups = [createTestGroup(), createTestGroup({ name: TableGroupName.create("Group 2") })];
      const summaries = TableGroupMapper.toSummaryList(groups);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].memberCount).toBe(2);
    });
  });
});
