import type {
  ImageMetadataConfig,
  ImageMetadataResult,
} from "./types.js";

export const OCI_VERSION = "1.1.0";

export const TABLEFLOW_LABEL_PREFIX = "com.tableflow";

export class ImageMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly maintainer?: string;
  readonly vendor?: string;
  readonly labels: Readonly<Record<string, string>>;
  readonly annotations: Readonly<Record<string, string>>;
  readonly licenses: readonly string[];
  readonly documentation?: string;
  readonly sourceRepository?: string;
  readonly created: string;

  constructor(config: ImageMetadataConfig) {
    this.name = config.name;
    this.version = config.version;
    this.description = config.description ?? "";
    this.maintainer = config.maintainer;
    this.vendor = config.vendor;
    this.labels = Object.freeze({ ...config.labels });
    this.annotations = Object.freeze({ ...config.annotations });
    this.licenses = Object.freeze([...(config.licenses ?? [])]);
    this.documentation = config.documentation;
    this.sourceRepository = config.sourceRepository;
    this.created = config.created ?? new Date().toISOString();
  }

  toLabels(): Record<string, string> {
    return {
      [`${TABLEFLOW_LABEL_PREFIX}.name`]: this.name,
      [`${TABLEFLOW_LABEL_PREFIX}.version`]: this.version,
      [`${TABLEFLOW_LABEL_PREFIX}.description`]: this.description,
      [`${TABLEFLOW_LABEL_PREFIX}.created`]: this.created,
      [`${TABLEFLOW_LABEL_PREFIX}.vendor`]: this.vendor ?? "",
      [`${TABLEFLOW_LABEL_PREFIX}.maintainer`]: this.maintainer ?? "",
      "org.opencontainers.image.title": this.name,
      "org.opencontainers.image.version": this.version,
      "org.opencontainers.image.description": this.description,
      "org.opencontainers.image.created": this.created,
      "org.opencontainers.image.vendor": this.vendor ?? "",
      "org.opencontainers.image.licenses": this.licenses.join(", "),
      "org.opencontainers.image.documentation": this.documentation ?? "",
      "org.opencontainers.image.source": this.sourceRepository ?? "",
      "org.opencontainers.image.revision": "",
      ...this.labels,
    };
  }

  toAnnotations(): Record<string, string> {
    return {
      ...this.annotations,
    };
  }

  toResult(): ImageMetadataResult {
    return {
      labels: this.toLabels(),
      annotations: this.toAnnotations(),
      ociVersion: OCI_VERSION,
      created: this.created,
    };
  }

  static createDefault(appName: string, version: string): ImageMetadata {
    return new ImageMetadata({
      name: appName,
      version,
      description: `TableFlow ${appName} service`,
      vendor: "TableFlow",
      labels: {},
      annotations: {},
      licenses: ["MIT"],
      sourceRepository: "https://github.com/tableflow/tableflow",
      documentation: "https://tableflow.dev/docs",
    });
  }

  static createBackend(version: string): ImageMetadata {
    return ImageMetadata.createDefault("backend", version);
  }

  static createFrontend(version: string): ImageMetadata {
    return ImageMetadata.createDefault("frontend", version);
  }
}
