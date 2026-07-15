import type {
  ServiceDefinitionConfig,
  ServiceType,
  PortDefinition,
  Protocol,
} from "./types.js";
import { SERVICE_TYPES } from "./types.js";
import { OrchestrationValidationError } from "./errors.js";

export class ServiceDefinition {
  readonly name: string;
  readonly type: ServiceType;
  readonly ports: readonly PortDefinition[];
  readonly selector: Readonly<Record<string, string>>;
  readonly clusterIP?: string;
  readonly loadBalancerIP?: string;
  readonly externalName?: string;
  readonly externalIPs: readonly string[];
  readonly sessionAffinity: boolean;
  readonly sessionAffinityTimeoutMs: number;

  constructor(config: ServiceDefinitionConfig) {
    ServiceDefinition.validate(config);

    this.name = config.name;
    this.type = config.type;
    this.ports = Object.freeze([...config.ports]);
    this.selector = Object.freeze({ ...config.selector });
    this.clusterIP = config.clusterIP;
    this.loadBalancerIP = config.loadBalancerIP;
    this.externalName = config.externalName;
    this.externalIPs = Object.freeze([...(config.externalIPs ?? [])]);
    this.sessionAffinity = config.sessionAffinity ?? false;
    this.sessionAffinityTimeoutMs = config.sessionAffinityTimeoutMs ?? 10_800_000;
  }

  private static validate(config: ServiceDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Service name is required");
    }

    if (!SERVICE_TYPES.includes(config.type)) {
      errors.push(`Invalid service type: ${config.type}`);
    }

    if (!config.ports || config.ports.length === 0) {
      errors.push("At least one port is required");
    }

    if (config.type === "external" && !config.externalName) {
      errors.push("External service type requires externalName");
    }

    const portNames = new Set<string>();
    for (const port of config.ports) {
      if (portNames.has(port.name)) {
        errors.push(`Duplicate port name: ${port.name}`);
      }
      portNames.add(port.name);

      if (port.port <= 0 || port.port > 65535) {
        errors.push(`Invalid port number: ${port.port}`);
      }
    }

    if (errors.length > 0) {
      throw new OrchestrationValidationError("Invalid service definition", errors);
    }
  }

  getPort(name: string): PortDefinition | undefined {
    return this.ports.find((p) => p.name === name);
  }

  getTargetPort(name: string): number | undefined {
    return this.ports.find((p) => p.name === name)?.targetPort;
  }

  isInternal(): boolean {
    return this.type === "internal";
  }

  isExternal(): boolean {
    return this.type === "external";
  }

  isLoadBalanced(): boolean {
    return this.type === "load_balanced";
  }

  isHeadless(): boolean {
    return this.type === "headless";
  }

  static createClusterIP(name: string, port: number, selector: Record<string, string>): ServiceDefinition {
    return new ServiceDefinition({
      name,
      type: "internal",
      ports: [{ name: "http", port, protocol: "TCP" }],
      selector,
    });
  }

  static createLoadBalancer(name: string, port: number, selector: Record<string, string>): ServiceDefinition {
    return new ServiceDefinition({
      name,
      type: "load_balanced",
      ports: [{ name: "http", port, protocol: "TCP" }],
      selector,
    });
  }

  static createHeadless(name: string, port: number, selector: Record<string, string>): ServiceDefinition {
    return new ServiceDefinition({
      name,
      type: "headless",
      clusterIP: "None",
      ports: [{ name: "http", port, protocol: "TCP" }],
      selector,
    });
  }
}
