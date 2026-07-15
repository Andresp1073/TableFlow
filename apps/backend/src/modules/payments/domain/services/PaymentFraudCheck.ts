export enum FraudRiskLevel {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export interface FraudCheckResult {
  riskLevel: FraudRiskLevel;
  score: number;
  flags: string[];
  recommendations: string[];
  requiresManualReview: boolean;
}

export interface FraudCheckInput {
  amount: number;
  currency: string;
  customerId?: string;
  customerEmail?: string;
  restaurantId: string;
  methodType: string;
  metadata: Record<string, string>;
}

export interface FraudCheckExtension {
  name: string;
  check(input: FraudCheckInput): Promise<FraudCheckResult>;
}

export class PaymentFraudCheck {
  private readonly extensions: FraudCheckExtension[] = [];

  registerExtension(extension: FraudCheckExtension): void {
    this.extensions.push(extension);
  }

  removeExtension(name: string): void {
    const index = this.extensions.findIndex((e) => e.name === name);
    if (index >= 0) {
      this.extensions.splice(index, 1);
    }
  }

  getExtensions(): FraudCheckExtension[] {
    return [...this.extensions];
  }

  async evaluate(input: FraudCheckInput): Promise<FraudCheckResult> {
    const allFlags: string[] = [];
    const allRecommendations: string[] = [];
    let maxScore = 0;
    let requiresManualReview = false;

    if (this.extensions.length === 0) {
      return {
        riskLevel: FraudRiskLevel.Low,
        score: 0,
        flags: [],
        recommendations: [],
        requiresManualReview: false,
      };
    }

    for (const extension of this.extensions) {
      try {
        const result = await extension.check(input);
        allFlags.push(...result.flags);
        allRecommendations.push(...result.recommendations);
        maxScore = Math.max(maxScore, result.score);
        if (result.requiresManualReview) {
          requiresManualReview = true;
        }
      } catch {
        allFlags.push(`${extension.name}: check failed`);
      }
    }

    const riskLevel = this.calculateRiskLevel(maxScore);

    return {
      riskLevel,
      score: maxScore,
      flags: [...new Set(allFlags)],
      recommendations: [...new Set(allRecommendations)],
      requiresManualReview,
    };
  }

  private calculateRiskLevel(score: number): FraudRiskLevel {
    if (score >= 80) return FraudRiskLevel.Critical;
    if (score >= 60) return FraudRiskLevel.High;
    if (score >= 30) return FraudRiskLevel.Medium;
    return FraudRiskLevel.Low;
  }
}
