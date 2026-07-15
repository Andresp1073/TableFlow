import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";

export type BuildStrategyType = "multi_stage" | "single_stage" | "distroless" | "scratch";

export const BUILD_STRATEGY_TYPES: BuildStrategyType[] = [
  "multi_stage",
  "single_stage",
  "distroless",
  "scratch",
];

export type ContainerRuntimeType = "docker" | "podman" | "containerd" | "oci";

export const CONTAINER_RUNTIME_TYPES: ContainerRuntimeType[] = [
  "docker",
  "podman",
  "containerd",
  "oci",
];

export type HealthCheckType = "startup" | "readiness" | "liveness";

export const HEALTH_CHECK_TYPES: HealthCheckType[] = [
  "startup",
  "readiness",
  "liveness",
];

export type HealthCheckStrategy = "command" | "http" | "tcp" | "grpc";

export type ContainerCapability =
  | "CHOWN"
  | "DAC_OVERRIDE"
  | "FSETID"
  | "FOWNER"
  | "MKNOD"
  | "NET_RAW"
  | "SETGID"
  | "SETUID"
  | "SETFCAP"
  | "SETPCAP"
  | "NET_BIND_SERVICE"
  | "SYS_CHROOT"
  | "KILL"
  | "AUDIT_WRITE";

export type ContainerUser = "root" | "node" | "nobody" | "appuser" | string;

export type FileSystemAccess = "read_write" | "read_only";

export type LogDriver = "json_file" | "journald" | "syslog" | "gelf" | "fluentd" | "awslogs" | "splunk" | "etw_logs" | "gcplogs" | "logentries";

export type RestartPolicy = "no" | "always" | "on_failure" | "unless_stopped";

export type ContainerEventType =
  | "container.build_started"
  | "container.build_completed"
  | "container.build_failed"
  | "container.started"
  | "container.stopped"
  | "container.health_check_passed"
  | "container.health_check_failed"
  | "container.startup_failed"
  | "container.readiness_failed"
  | "container.liveness_failed";

export interface PortMapping {
  containerPort: number;
  hostPort?: number;
  protocol: "tcp" | "udp";
}

export interface VolumeMount {
  source: string;
  target: string;
  type: "bind" | "volume" | "tmpfs";
  readOnly?: boolean;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  secret?: boolean;
  source?: "config" | "secret" | "literal";
}

export interface HealthCheckConfig {
  type: HealthCheckType;
  strategy: HealthCheckStrategy;
  command?: string[];
  httpPath?: string;
  httpPort?: number;
  tcpPort?: number;
  grpcService?: string;
  intervalMs: number;
  timeoutMs: number;
  retries: number;
  startPeriodMs?: number;
}

export interface BuildStage {
  name: string;
  baseImage: string;
  platform?: string;
  commands: string[];
  copyFrom?: string[];
  exposePorts?: number[];
  workdir?: string;
  user?: string;
  env?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface ContainerResources {
  cpuLimit?: string;
  memoryLimit?: string;
  cpuReservation?: string;
  memoryReservation?: string;
}

export interface ContainerLogging {
  driver: LogDriver;
  options?: Record<string, string>;
}

export interface ContainerSecret {
  source: string;
  target: string;
  uid?: number;
  gid?: number;
  mode?: number;
}

export interface ContainerDefinitionConfig {
  name: string;
  baseImage: string;
  description?: string;
  ports: PortMapping[];
  volumes: VolumeMount[];
  environment: EnvironmentVariable[];
  healthChecks: HealthCheckConfig[];
  resources?: ContainerResources;
  logging?: ContainerLogging;
  secrets?: ContainerSecret[];
  restartPolicy?: RestartPolicy;
  securityProfile: ContainerSecurityProfileConfig;
  buildStages: BuildStage[];
  buildStrategy: BuildStrategyType;
  runtimeType: ContainerRuntimeType;
  metadata: ImageMetadataConfig;
}

export interface ContainerSecurityProfileConfig {
  user: ContainerUser;
  group?: string;
  fileSystemAccess: FileSystemAccess;
  droppedCapabilities: ContainerCapability[];
  addedCapabilities: ContainerCapability[];
  allowPrivilegeEscalation: boolean;
  seccompProfile?: "default" | "unconfined" | string;
  appArmorProfile?: string;
  readonlyRootFilesystem: boolean;
  tmpfsMounts: string[];
}

export interface ImageMetadataConfig {
  name: string;
  version: string;
  description?: string;
  maintainer?: string;
  vendor?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  licenses?: string[];
  documentation?: string;
  sourceRepository?: string;
  created?: string;
}

export interface ImageMetadataResult {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  ociVersion: string;
  created: string;
}

export interface HealthEndpoint {
  type: HealthCheckType;
  path: string;
  port: number;
  expectedStatus: number;
}

export interface HealthDependency {
  name: string;
  type: string;
  required: boolean;
  timeoutMs: number;
}

export interface HealthCheckResult {
  type: HealthCheckType;
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  durationMs: number;
  error?: string;
  dependencies: HealthDependencyResult[];
}

export interface HealthDependencyResult {
  name: string;
  status: "healthy" | "unhealthy";
  durationMs: number;
  error?: string;
}

export interface ContainerBuilderOptions {
  strategy: BuildStrategyType;
  stages: BuildStage[];
  outputDir?: string;
  tags?: string[];
  platform?: string;
  cacheFrom?: string[];
  noCache?: boolean;
  pull?: boolean;
  buildArgs?: Record<string, string>;
  secrets?: ContainerSecret[];
  ssh?: string;
}

export interface ContainerRuntimeConfig {
  type: ContainerRuntimeType;
  name: string;
  image: string;
  command?: string[];
  entrypoint?: string[];
  ports: PortMapping[];
  volumes: VolumeMount[];
  environment: EnvironmentVariable[];
  healthChecks: HealthCheckConfig[];
  resources?: ContainerResources;
  logging?: ContainerLogging;
  secrets?: ContainerSecret[];
  restartPolicy: RestartPolicy;
  securityProfile: ContainerSecurityProfileConfig;
  networkMode?: string;
  dns?: string[];
  extraHosts?: Record<string, string>;
  labels: Record<string, string>;
  stopGracePeriodMs: number;
  readOnly: boolean;
  tmpfs: string[];
  init: boolean;
}

export interface ContainerRuntimeInterface {
  readonly type: ContainerRuntimeType;
  create(config: ContainerRuntimeConfig, logger?: Logger): Promise<string>;
  start(containerId: string): Promise<void>;
  stop(containerId: string, timeoutMs?: number): Promise<void>;
  restart(containerId: string, timeoutMs?: number): Promise<void>;
  remove(containerId: string, force?: boolean): Promise<void>;
  getStatus(containerId: string): Promise<ContainerStatus>;
  getLogs(containerId: string, tail?: number): Promise<string[]>;
  execute(containerId: string, command: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

export interface ContainerStatus {
  containerId: string;
  state: "created" | "running" | "paused" | "stopped" | "exited" | "removing";
  startedAt?: Date;
  finishedAt?: Date;
  exitCode?: number;
  health?: "healthy" | "unhealthy" | "starting";
}

export interface ContainerDefinitionInterface {
  readonly name: string;
  readonly image: string;
  validate(): string[];
  toRuntimeConfig(): ContainerRuntimeConfig;
}

export interface ContainerHealthManagerInterface {
  readonly endpoints: readonly HealthEndpoint[];
  readonly dependencies: readonly HealthDependency[];
  performStartupCheck(): Promise<HealthCheckResult>;
  performReadinessCheck(): Promise<HealthCheckResult>;
  performLivenessCheck(): Promise<HealthCheckResult>;
  checkDependencies(): Promise<HealthDependencyResult[]>;
}

export interface ContainerSecurityManagerInterface {
  readonly profile: ContainerSecurityProfileConfig;
  validate(): string[];
  toDockerSecurityOptions(): string[];
}

export interface ContainerTemplateOptions {
  appName: string;
  baseImage?: string;
  workdir?: string;
  exposePort: number;
  buildCommand?: string;
  startCommand?: string[];
  nodeVersion?: string;
}

export interface DockerfileResult {
  filename: string;
  content: string;
}
