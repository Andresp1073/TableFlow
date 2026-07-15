import type {
  ContainerSecurityProfileConfig,
  ContainerCapability,
  ContainerUser,
  FileSystemAccess,
} from "./types.js";
import { ContainerValidationError } from "./errors.js";

export const DEFAULT_DROPPED_CAPABILITIES: ContainerCapability[] = [
  "SETUID",
  "SETGID",
  "NET_RAW",
  "SYS_CHROOT",
  "MKNOD",
  "AUDIT_WRITE",
  "SETFCAP",
  "FSETID",
  "FOWNER",
  "DAC_OVERRIDE",
  "CHOWN",
  "KILL",
  "SETPCAP",
  "NET_BIND_SERVICE",
];

export const MINIMAL_DROPPED_CAPABILITIES: ContainerCapability[] = [
  "SETUID",
  "SETGID",
  "NET_RAW",
  "SYS_CHROOT",
  "MKNOD",
];

export class ContainerSecurityProfile {
  readonly user: ContainerUser;
  readonly group?: string;
  readonly fileSystemAccess: FileSystemAccess;
  readonly droppedCapabilities: readonly ContainerCapability[];
  readonly addedCapabilities: readonly ContainerCapability[];
  readonly allowPrivilegeEscalation: boolean;
  readonly seccompProfile?: string;
  readonly appArmorProfile?: string;
  readonly readonlyRootFilesystem: boolean;
  readonly tmpfsMounts: readonly string[];

  constructor(config: ContainerSecurityProfileConfig) {
    this.user = config.user;
    this.group = config.group;
    this.fileSystemAccess = config.fileSystemAccess;
    this.droppedCapabilities = Object.freeze([...config.droppedCapabilities]);
    this.addedCapabilities = Object.freeze([...config.addedCapabilities]);
    this.allowPrivilegeEscalation = config.allowPrivilegeEscalation;
    this.seccompProfile = config.seccompProfile;
    this.appArmorProfile = config.appArmorProfile;
    this.readonlyRootFilesystem = config.readonlyRootFilesystem;
    this.tmpfsMounts = Object.freeze([...config.tmpfsMounts]);
  }

  validate(): string[] {
    const errors: string[] = [];

    if (this.allowPrivilegeEscalation) {
      errors.push("Privilege escalation should be disabled for production containers");
    }

    if (!this.readonlyRootFilesystem && this.fileSystemAccess === "read_only") {
      errors.push("File system access is read-only but readonlyRootFilesystem is not set");
    }

    if (this.droppedCapabilities.includes("SETUID" as ContainerCapability) && this.droppedCapabilities.includes("SETGID" as ContainerCapability)) {
      if (this.user === "root") {
        errors.push("Running as root with SETUID and SETGID dropped may cause issues");
      }
    }

    return errors;
  }

  toDockerSecurityOptions(): string[] {
    const options: string[] = [];

    if (this.user !== "root") {
      options.push(`--user=${this.user}`);
    }

    if (this.readonlyRootFilesystem) {
      options.push("--read-only");
    }

    for (const cap of this.droppedCapabilities) {
      options.push(`--cap-drop=${cap}`);
    }

    for (const cap of this.addedCapabilities) {
      options.push(`--cap-add=${cap}`);
    }

    if (!this.allowPrivilegeEscalation) {
      options.push("--security-opt=no-new-privileges:true");
    }

    if (this.seccompProfile && this.seccompProfile !== "default") {
      options.push(`--security-opt=seccomp=${this.seccompProfile}`);
    }

    if (this.appArmorProfile) {
      options.push(`--security-opt=apparmor=${this.appArmorProfile}`);
    }

    for (const tmpfs of this.tmpfsMounts) {
      options.push(`--tmpfs=${tmpfs}`);
    }

    return options;
  }

  static createProduction(): ContainerSecurityProfile {
    return new ContainerSecurityProfile({
      user: "appuser",
      group: "nodejs",
      fileSystemAccess: "read_only",
      droppedCapabilities: [...DEFAULT_DROPPED_CAPABILITIES],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      seccompProfile: "default",
      readonlyRootFilesystem: true,
      tmpfsMounts: ["/tmp", "/var/run"],
    });
  }

  static createDevelopment(): ContainerSecurityProfile {
    return new ContainerSecurityProfile({
      user: "node",
      fileSystemAccess: "read_write",
      droppedCapabilities: [...MINIMAL_DROPPED_CAPABILITIES],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      readonlyRootFilesystem: false,
      tmpfsMounts: [],
    });
  }

  static createMinimal(): ContainerSecurityProfile {
    return new ContainerSecurityProfile({
      user: "nobody",
      fileSystemAccess: "read_only",
      droppedCapabilities: [...DEFAULT_DROPPED_CAPABILITIES],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      seccompProfile: "default",
      appArmorProfile: "runtime-default",
      readonlyRootFilesystem: true,
      tmpfsMounts: ["/tmp"],
    });
  }
}
