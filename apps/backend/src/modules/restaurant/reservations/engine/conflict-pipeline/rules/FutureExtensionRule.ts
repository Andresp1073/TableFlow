import type { ConflictRule, PipelineContext } from "../ConflictRule.js";
import type { ConflictResult } from "../ConflictResult.js";
import { noConflict } from "../ConflictResult.js";

export class FutureExtensionRule implements ConflictRule {
  readonly name = "future_extension";

  async evaluate(_context: PipelineContext): Promise<ConflictResult> {
    return noConflict();
  }
}
