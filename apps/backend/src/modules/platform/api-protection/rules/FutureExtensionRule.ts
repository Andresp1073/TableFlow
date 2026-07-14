import { BaseRule } from "./ProtectionRule.js";
import type { ProtectionContext, ProtectionDecision } from "../types.js";

export class FutureExtensionRule extends BaseRule {
  private readonly extensionCheck: (context: ProtectionContext) => Promise<ProtectionDecision | null>;

  constructor(
    name: string,
    priority: number,
    extensionCheck: (context: ProtectionContext) => Promise<ProtectionDecision | null>,
    enabled = true,
  ) {
    super(name, priority, enabled);
    this.extensionCheck = extensionCheck;
  }

  async evaluate(context: ProtectionContext): Promise<ProtectionDecision> {
    const result = await this.extensionCheck(context);

    if (result !== null) {
      return result;
    }

    return this.skip("No extension check triggered");
  }
}
