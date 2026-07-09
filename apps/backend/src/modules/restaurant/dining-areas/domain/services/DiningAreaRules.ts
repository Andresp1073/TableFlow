export class DiningAreaRules {
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    if (currentStatus === "archived") {
      throw new Error("Cannot modify an archived dining area");
    }
    if (currentStatus === newStatus) {
      return;
    }
    if (currentStatus === "active" && newStatus !== "archived") {
      throw new Error("Active dining areas can only be transitioned to archived");
    }
  }

  static validateNotArchived(status: string): void {
    if (status === "archived") {
      throw new Error("Cannot modify an archived dining area");
    }
  }
}
