import type { AvailabilityEvaluator } from "./AvailabilityEvaluator.js";
import type { AvailabilityContext } from "./AvailabilityContext.js";
import type { AvailabilityResult } from "./AvailabilityResult.js";

export class AvailabilityEngine {
  constructor(private readonly evaluators: readonly AvailabilityEvaluator[]) {}

  async evaluate(context: AvailabilityContext): Promise<AvailabilityResult> {
    for (const evaluator of this.evaluators) {
      const result = await evaluator.evaluate(context);
      if (!result.available) {
        return result;
      }
    }
    return { available: true, reason: null };
  }

  async evaluateAll(context: AvailabilityContext): Promise<AvailabilityResult[]> {
    const results: AvailabilityResult[] = [];
    for (const evaluator of this.evaluators) {
      const result = await evaluator.evaluate(context);
      results.push({ ...result, metadata: { ...result.metadata, evaluator: evaluator.name } });
      if (!result.available) {
        break;
      }
    }
    return results;
  }
}
