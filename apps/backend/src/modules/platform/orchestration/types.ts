import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type DeploymentStrategyType = "rolling_update" | "blue_green" | "canary" | "recreate";

export const DEPLOYMENT_STRATEGY_TYPES: DeploymentStrategyType[] = [
  "rolling_update",
  "blue_green",
  "canary",
  "recreate",
];

export type DeploymentStatus =
  | "pending"
  | "deploying"
  | "healthy"
  | "degraded"
  | "failed"
  | "rolled_back"
  | "cancelled";

export type ServiceType = "internal" | "external" | "load_balanced" | "headless";

export const SERVICE_TYPES: ServiceType[] = [
  "internal",
  "external",
  "load_balanced",
  "headless",
];

export type ScalingStrategyType = "horizontal" | "vertical" | "auto" | "scheduled";

export const SCALING_STRATEGY_TYPES: ScalingStrategyType[] = [
  "horizontal",
  "vertical",
  "auto",
  "scheduled",
];

export type OrchestrationProviderType =
  | "kubernetes"
  | "openshift"
  | "ecs"
  | "azure_container_apps"
  | "nomad"
  | "google_cloud_run";

export const ORCHESTRATION_PROVIDER_TYPES: OrchestrationProviderType[] = [
  "kubernetes",
  "openshift",
  "ecs",
  "azure_container_apps",
  "nomad",
  "google_cloud_run",
];

export type NetworkPolicyType = "ingress" | "egress" | "both";

export type Protocol = "TCP" | "UDP" | "SCTP";

export type AffinityType = "required" | "preferred";

export type OrchestrationEventType =
  | "deployment.started"
  | "deployment.completed"
  | "deployment.failed"
  | "deployment.rolled_back"
  | "deployment.strategy_changed"
  | "scaling.triggered"
  | "scaling.completed"
  | "scaling.failed"
  | "service.created"
  | "service.updated"
  | "service.deleted";

export interface ResourceSpec {
  cpu: string;
  memory: string;
  ephemeralStorage?: string;
  gpu?: {
    count: number;
    type: string;
  };
}

export interface ResourceRequirements {
  requests: ResourceSpec;
  limits: ResourceSpec;
}

export interface LabelSelector {
  matchLabels: Record<string, string>;
  matchExpressions?: LabelSelectorRequirement[];
}

export interface LabelSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist";
  values?: string[];
}

export interface AffinityTerm {
  labelSelector: LabelSelector;
  topologyKey: string;
  namespaces?: string[];
}

export interface Affinity {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAntiAffinity;
}

export interface NodeAffinity {
  requiredDuringScheduling?: NodeSelector;
  preferredDuringScheduling?: PreferredSchedulingTerm[];
}

export interface NodeSelector {
  nodeSelectorTerms: NodeSelectorTerm[];
}

export interface NodeSelectorTerm {
  matchExpressions: NodeSelectorRequirement[];
  matchFields?: NodeSelectorRequirement[];
}

export interface NodeSelectorRequirement {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";
  values?: string[];
}

export interface PreferredSchedulingTerm {
  weight: number;
  preference: NodeSelectorTerm;
}

export interface PodAffinity {
  requiredDuringScheduling?: AffinityTerm[];
  preferredDuringScheduling?: WeightedAffinityTerm[];
}

export interface PodAntiAffinity {
  requiredDuringScheduling?: AffinityTerm[];
  preferredDuringScheduling?: WeightedAffinityTerm[];
}

export interface WeightedAffinityTerm {
  weight: number;
  podAffinityTerm: AffinityTerm;
}

export interface Toleration {
  key: string;
  operator: "Exists" | "Equal";
  value?: string;
  effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
  tolerationSeconds?: number;
}

export interface RollingUpdateConfig {
  maxUnavailable: number | string;
  maxSurge: number | string;
}

export interface BlueGreenConfig {
  previewServiceName: string;
  activeServiceName: string;
  autoPromote: boolean;
  promoteDelayMs: number;
}

export interface CanaryConfig {
  steps: CanaryStep[];
  trafficMirroring: boolean;
  analysisDurationMs: number;
}

export interface CanaryStep {
  weight: number;
  pauseMs: number;
  requirements?: string[];
}

export interface RecreateConfig {
  preStopHook?: string;
  postStartHook?: string;
  maxShutdownTimeMs: number;
}

export interface DeploymentStrategyConfig {
  type: DeploymentStrategyType;
  rollingUpdate?: RollingUpdateConfig;
  blueGreen?: BlueGreenConfig;
  canary?: CanaryConfig;
  recreate?: RecreateConfig;
}

export interface ScalingPolicyConfig {
  strategy: ScalingStrategyType;
  minReplicas: number;
  maxReplicas: number;
  targetReplicas?: number;
  metrics?: ScalingMetric[];
  schedule?: ScalingSchedule[];
  cooldownPeriodMs: number;
  scaleDownStabilizationMs: number;
}

export interface ScalingMetric {
  type: "cpu" | "memory" | "requests_per_second" | "custom";
  targetAverageValue?: string;
  targetAverageUtilization?: number;
  customMetricName?: string;
}

export interface ScalingSchedule {
  name: string;
  cronExpression: string;
  targetReplicas: number;
  timezone: string;
}

export interface HorizontalScalingConfig {
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilization?: number;
  targetMemoryUtilization?: number;
  customMetrics?: ScalingMetric[];
}

export interface VerticalScalingConfig {
  minCpu: string;
  maxCpu: string;
  minMemory: string;
  maxMemory: string;
  updateMode: "auto" | "initial";
}

export interface PortDefinition {
  name: string;
  port: number;
  targetPort?: number;
  protocol: Protocol;
  nodePort?: number;
}

export interface ServiceDefinitionConfig {
  name: string;
  type: ServiceType;
  ports: PortDefinition[];
  selector: Record<string, string>;
  clusterIP?: string;
  loadBalancerIP?: string;
  externalName?: string;
  externalIPs?: string[];
  sessionAffinity?: boolean;
  sessionAffinityTimeoutMs?: number;
  dns?: ServiceDnsConfig;
}

export interface ServiceDnsConfig {
  hostname?: string;
  subdomain?: string;
  publishNotReadyAddresses?: boolean;
}

export interface NetworkPolicyDefinitionConfig {
  name: string;
  policyType: NetworkPolicyType;
  podSelector: LabelSelector;
  ingressRules?: NetworkPolicyRule[];
  egressRules?: NetworkPolicyRule[];
  policyTypes: NetworkPolicyType[];
}

export interface NetworkPolicyRule {
  ports?: NetworkPolicyPort[];
  from?: NetworkPolicyPeer[];
  to?: NetworkPolicyPeer[];
}

export interface NetworkPolicyPort {
  port?: number | string;
  protocol?: Protocol;
  endPort?: number;
}

export interface NetworkPolicyPeer {
  podSelector?: LabelSelector;
  namespaceSelector?: LabelSelector;
  ipBlock?: IPBlock;
}

export interface IPBlock {
  cidr: string;
  except?: string[];
}

export interface RuntimeProfileConfig {
  name: string;
  description?: string;
  resources: ResourceRequirements;
  affinity?: Affinity;
  nodeSelector?: Record<string, string>;
  tolerations?: Toleration[];
  priorityClassName?: string;
  schedulerName?: string;
  topologySpreadConstraints?: TopologySpreadConstraint[];
}

export interface TopologySpreadConstraint {
  maxSkew: number;
  topologyKey: string;
  whenUnsatisfiable: "DoNotSchedule" | "ScheduleAnyway";
  labelSelector: LabelSelector;
}

export interface DeploymentDefinitionConfig {
  name: string;
  namespace?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  replicas: number;
  strategy: DeploymentStrategyConfig;
  runtimeProfile: RuntimeProfileConfig;
  scalingPolicy: ScalingPolicyConfig;
  serviceDefinition?: ServiceDefinitionConfig;
  networkPolicies?: NetworkPolicyDefinitionConfig[];
  healthCheckPath?: string;
  healthCheckPort?: number;
  revisionHistoryLimit?: number;
  progressDeadlineSeconds?: number;
  minReadySeconds?: number;
  paused: boolean;
}

export interface DeploymentResult {
  id: string;
  name: string;
  status: DeploymentStatus;
  strategy: DeploymentStrategyType;
  replicas: number;
  availableReplicas: number;
  readyReplicas: number;
  updatedReplicas: number;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ScalingResult {
  policyName: string;
  strategy: ScalingStrategyType;
  previousReplicas: number;
  newReplicas: number;
  status: DeploymentStatus;
  triggeredAt: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface OrchestrationProvider {
  readonly name: string;
  readonly providerType: OrchestrationProviderType;
  deploy(config: DeploymentDefinitionConfig): Promise<DeploymentResult>;
  scale(name: string, replicas: number): Promise<ScalingResult>;
  rollback(name: string, revision?: string): Promise<DeploymentResult>;
  getStatus(name: string): Promise<DeploymentResult>;
  delete(name: string): Promise<void>;
}

export interface DeploymentManagerInterface {
  deploy(config: DeploymentDefinitionConfig): Promise<DeploymentResult>;
  scale(name: string, replicas: number, strategy?: ScalingStrategyType): Promise<ScalingResult>;
  rollback(name: string, revision?: string): Promise<DeploymentResult>;
  getStatus(name: string): Promise<DeploymentResult>;
  delete(name: string): Promise<void>;
  list(): Promise<DeploymentResult[]>;
}

export interface OrchestrationManagerOptions {
  logger?: Logger;
  eventPublisher?: EventPublisher;
  defaultNamespace?: string;
}
