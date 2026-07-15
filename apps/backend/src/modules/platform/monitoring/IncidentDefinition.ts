import type {
  IncidentDefinitionConfig,
  IncidentSeverity,
  IncidentStatus,
  IncidentResult,
  IncidentTimelineEntry,
  EscalationPolicyConfig,
} from "./types.js";
import { MonitoringValidationError } from "./errors.js";
import { generateEventId } from "../event-bus/EventMetadata.js";

export class IncidentDefinition {
  readonly title: string;
  readonly description: string;
  readonly severity: IncidentSeverity;
  readonly alertId?: string;
  readonly service?: string;
  readonly assignee?: string;
  readonly escalationPolicy?: EscalationPolicyConfig;
  readonly tags: readonly string[];

  constructor(config: IncidentDefinitionConfig) {
    IncidentDefinition.validate(config);

    this.title = config.title;
    this.description = config.description;
    this.severity = config.severity;
    this.alertId = config.alertId;
    this.service = config.service;
    this.assignee = config.assignee;
    this.escalationPolicy = config.escalationPolicy;
    this.tags = Object.freeze([...(config.tags ?? [])]);
  }

  private static validate(config: IncidentDefinitionConfig): void {
    const errors: string[] = [];

    if (!config.title || config.title.trim().length === 0) {
      errors.push("Incident title is required");
    }

    if (!config.description || config.description.trim().length === 0) {
      errors.push("Incident description is required");
    }

    if (errors.length > 0) {
      throw new MonitoringValidationError("Invalid incident definition", errors);
    }
  }

  createResult(): IncidentResult {
    const now = new Date();

    const timeline: IncidentTimelineEntry[] = [
      { timestamp: now, type: "created", message: `Incident created: ${this.title}`, actor: "system" },
    ];

    return {
      id: generateEventId(),
      title: this.title,
      description: this.description,
      severity: this.severity,
      status: "firing",
      alertId: this.alertId,
      service: this.service,
      assignee: this.assignee,
      escalationPolicy: this.escalationPolicy,
      timeline,
      tags: [...this.tags],
      createdAt: now,
    };
  }

  static createSev0(title: string, description: string, service?: string): IncidentDefinition {
    return new IncidentDefinition({ title, description, severity: "sev0", service, tags: ["sev0", "critical"] });
  }

  static createSev1(title: string, description: string, service?: string): IncidentDefinition {
    return new IncidentDefinition({ title, description, severity: "sev1", service, tags: ["sev1", "high"] });
  }

  static createSev2(title: string, description: string, service?: string): IncidentDefinition {
    return new IncidentDefinition({ title, description, severity: "sev2", service, tags: ["sev2", "medium"] });
  }
}

export class IncidentManager {
  private readonly incidents: Map<string, IncidentResult> = new Map();

  create(config: IncidentDefinitionConfig): IncidentResult {
    const definition = new IncidentDefinition(config);
    const result = definition.createResult();
    this.incidents.set(result.id, result);
    return result;
  }

  get(id: string): IncidentResult | undefined {
    return this.incidents.get(id);
  }

  updateStatus(id: string, status: IncidentStatus, actor?: string, message?: string): IncidentResult | undefined {
    const incident = this.incidents.get(id);
    if (!incident) {
      return undefined;
    }

    const now = new Date();
    const timelineEntry: IncidentTimelineEntry = {
      timestamp: now,
      type: status === "resolved" || status === "closed" ? "resolved" : status === "acknowledged" ? "acknowledged" : "note",
      message: message ?? `Status changed to ${status}`,
      actor: actor ?? "system",
    };

    const updated: IncidentResult = {
      ...incident,
      status,
      acknowledgedAt: status === "acknowledged" ? now : incident.acknowledgedAt,
      resolvedAt: status === "resolved" || status === "closed" ? now : incident.resolvedAt,
      closedAt: status === "closed" ? now : incident.closedAt,
      durationMs: status === "resolved" || status === "closed" ? now.getTime() - incident.createdAt.getTime() : incident.durationMs,
      timeline: [...incident.timeline, timelineEntry],
    };

    this.incidents.set(id, updated);
    return updated;
  }

  list(status?: IncidentStatus): IncidentResult[] {
    const all = Array.from(this.incidents.values());
    if (status) {
      return all.filter((i) => i.status === status);
    }
    return all;
  }

  addTimelineEntry(id: string, type: IncidentTimelineEntry["type"], message: string, actor?: string): IncidentResult | undefined {
    const incident = this.incidents.get(id);
    if (!incident) {
      return undefined;
    }

    const entry: IncidentTimelineEntry = {
      timestamp: new Date(),
      type,
      message,
      actor,
    };

    const updated: IncidentResult = {
      ...incident,
      timeline: [...incident.timeline, entry],
    };

    this.incidents.set(id, updated);
    return updated;
  }
}
