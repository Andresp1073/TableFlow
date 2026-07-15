import type {
  NetworkPolicyDefinitionConfig,
  NetworkPolicyType,
  NetworkPolicyRule,
  NetworkPolicyPort,
  NetworkPolicyPeer,
  LabelSelector,
  Protocol,
} from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export class NetworkPolicyDefinition {
  readonly name: string;
  readonly policyType: NetworkPolicyType;
  readonly podSelector: LabelSelector;
  readonly ingressRules: readonly NetworkPolicyRule[];
  readonly egressRules: readonly NetworkPolicyRule[];
  readonly policyTypes: readonly NetworkPolicyType[];

  constructor(config: NetworkPolicyDefinitionConfig) {
    NetworkPolicyDefinition.validate(config);

    this.name = config.name;
    this.policyType = config.policyType;
    this.podSelector = { ...config.podSelector };
    this.ingressRules = Object.freeze([...(config.ingressRules ?? [])]);
    this.egressRules = Object.freeze([...(config.egressRules ?? [])]);
    this.policyTypes = Object.freeze([...config.policyTypes]);
  }

  private static validate(config: NetworkPolicyDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Network policy name is required");
    }

    if (!config.podSelector || Object.keys(config.podSelector).length === 0) {
      errors.push("Pod selector is required");
    }

    if (config.policyTypes.length === 0) {
      errors.push("At least one policy type (ingress/egress) is required");
    }

    if (errors.length > 0) {
      throw new OrchestrationValidationError("Invalid network policy definition", errors);
    }
  }

  allowsIngress(): boolean {
    return this.policyTypes.includes("ingress") || this.policyType === "both";
  }

  allowsEgress(): boolean {
    return this.policyTypes.includes("egress") || this.policyType === "both";
  }

  static createDenyAllIngress(name: string, podSelector: LabelSelector): NetworkPolicyDefinition {
    return new NetworkPolicyDefinition({
      name,
      policyType: "ingress",
      podSelector,
      policyTypes: ["ingress"],
    });
  }

  static createAllowAllIngress(name: string, podSelector: LabelSelector): NetworkPolicyDefinition {
    return new NetworkPolicyDefinition({
      name,
      policyType: "ingress",
      podSelector,
      ingressRules: [{}],
      policyTypes: ["ingress"],
    });
  }

  static createAllowSpecificIngress(
    name: string,
    podSelector: LabelSelector,
    allowedPorts: NetworkPolicyPort[],
    allowedPeers?: NetworkPolicyPeer[],
  ): NetworkPolicyDefinition {
    return new NetworkPolicyDefinition({
      name,
      policyType: "ingress",
      podSelector,
      ingressRules: [
        {
          ports: allowedPorts,
          from: allowedPeers,
        },
      ],
      policyTypes: ["ingress"],
    });
  }

  static createIsolated(name: string, podSelector: LabelSelector): NetworkPolicyDefinition {
    return new NetworkPolicyDefinition({
      name,
      policyType: "both",
      podSelector,
      ingressRules: [{}],
      egressRules: [{}],
      policyTypes: ["ingress", "egress"],
    });
  }
}
