import { describe, it, expect } from "vitest";
import { ContainerSecurityProfile, DEFAULT_DROPPED_CAPABILITIES, MINIMAL_DROPPED_CAPABILITIES } from "../ContainerSecurityProfile.js";

describe("ContainerSecurityProfile", () => {
  it("creates a security profile", () => {
    const profile = new ContainerSecurityProfile({
      user: "appuser",
      fileSystemAccess: "read_only",
      droppedCapabilities: [],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      readonlyRootFilesystem: true,
      tmpfsMounts: ["/tmp"],
    });

    expect(profile.user).toBe("appuser");
    expect(profile.fileSystemAccess).toBe("read_only");
    expect(profile.readonlyRootFilesystem).toBe(true);
  });

  it("validates with warnings for privilege escalation", () => {
    const profile = new ContainerSecurityProfile({
      user: "appuser",
      fileSystemAccess: "read_write",
      droppedCapabilities: [],
      addedCapabilities: [],
      allowPrivilegeEscalation: true,
      readonlyRootFilesystem: false,
      tmpfsMounts: [],
    });

    const errors = profile.validate();
    expect(errors).toContain("Privilege escalation should be disabled for production containers");
  });

  it("generates Docker security options", () => {
    const profile = ContainerSecurityProfile.createProduction();
    const options = profile.toDockerSecurityOptions();

    expect(options).toContain("--user=appuser");
    expect(options).toContain("--read-only");
    expect(options).toContain("--security-opt=no-new-privileges:true");
    expect(options.some((o) => o.startsWith("--cap-drop="))).toBe(true);
  });

  it("includes tmpfs mounts in security options", () => {
    const profile = new ContainerSecurityProfile({
      user: "nobody",
      fileSystemAccess: "read_only",
      droppedCapabilities: [],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      readonlyRootFilesystem: true,
      tmpfsMounts: ["/tmp", "/var/run"],
    });

    const options = profile.toDockerSecurityOptions();
    expect(options).toContain("--tmpfs=/tmp");
    expect(options).toContain("--tmpfs=/var/run");
  });

  it("creates production profile", () => {
    const profile = ContainerSecurityProfile.createProduction();
    expect(profile.user).toBe("appuser");
    expect(profile.readonlyRootFilesystem).toBe(true);
    expect(profile.allowPrivilegeEscalation).toBe(false);
    expect(profile.droppedCapabilities.length).toBeGreaterThan(0);
    expect(profile.tmpfsMounts).toContain("/tmp");
  });

  it("creates development profile", () => {
    const profile = ContainerSecurityProfile.createDevelopment();
    expect(profile.user).toBe("node");
    expect(profile.readonlyRootFilesystem).toBe(false);
    expect(profile.fileSystemAccess).toBe("read_write");
  });

  it("creates minimal profile", () => {
    const profile = ContainerSecurityProfile.createMinimal();
    expect(profile.user).toBe("nobody");
    expect(profile.readonlyRootFilesystem).toBe(true);
    expect(profile.seccompProfile).toBe("default");
    expect(profile.appArmorProfile).toBe("runtime-default");
  });

  it("defines DEFAULT_DROPPED_CAPABILITIES", () => {
    expect(DEFAULT_DROPPED_CAPABILITIES.length).toBeGreaterThan(0);
    expect(DEFAULT_DROPPED_CAPABILITIES).toContain("SETUID");
    expect(DEFAULT_DROPPED_CAPABILITIES).toContain("NET_RAW");
  });

  it("defines MINIMAL_DROPPED_CAPABILITIES", () => {
    expect(MINIMAL_DROPPED_CAPABILITIES.length).toBeGreaterThan(0);
    expect(MINIMAL_DROPPED_CAPABILITIES).toContain("SETUID");
  });

  it("includes seccomp and apparmor options when configured", () => {
    const profile = new ContainerSecurityProfile({
      user: "nobody",
      fileSystemAccess: "read_only",
      droppedCapabilities: [],
      addedCapabilities: [],
      allowPrivilegeEscalation: false,
      seccompProfile: "custom.json",
      appArmorProfile: "custom-profile",
      readonlyRootFilesystem: true,
      tmpfsMounts: [],
    });

    const options = profile.toDockerSecurityOptions();
    expect(options).toContain("--security-opt=seccomp=custom.json");
    expect(options).toContain("--security-opt=apparmor=custom-profile");
  });
});
