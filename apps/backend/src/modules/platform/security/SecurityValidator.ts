import type {
  SecurityValidator as SecurityValidatorInterface,
  SecurityValidationResult,
  SecurityPolicy,
  SecurityPolicyResult,
  SecurityContext,
} from "./types.js";

export class SecurityValidator implements SecurityValidatorInterface {
  async validate(
    context: SecurityContext,
    data: unknown,
    policies: SecurityPolicy[],
  ): Promise<SecurityValidationResult> {
    const results: SecurityPolicyResult[] = [];

    for (const policy of policies) {
      if (!policy.enabled) {
        continue;
      }

      try {
        const result = await policy.evaluate(context, data);

        results.push(result);
      } catch (error) {
        results.push({
          passed: false,
          policyName: policy.name,
          policyType: policy.type,
          severity: "high",
          message: `Policy evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    const failedPolicies = results.filter((r) => !r.passed);

    return {
      passed: failedPolicies.length === 0,
      results,
      failedPolicies,
    };
  }
}
