const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const SUPPORTED_LANGUAGES: readonly string[] = [
  "en",
  "en-US",
  "es",
  "es-MX",
  "fr",
  "fr-CA",
  "de",
  "it",
  "pt",
  "pt-BR",
  "ja",
  "ko",
  "zh",
  "zh-CN",
  "zh-TW",
  "ar",
  "ar-SA",
  "ru",
  "nl",
  "sv",
  "da",
  "no",
  "fi",
  "pl",
  "tr",
  "th",
  "vi",
];

export class RestaurantLanguage {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantLanguage {
    const trimmed = value.trim();

    if (!LANGUAGE_PATTERN.test(trimmed)) {
      throw new Error(
        "Restaurant language must be a valid ISO 639-1 code (e.g., 'en', 'es', 'fr')"
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(trimmed)) {
      throw new Error(
        `Unsupported language "${trimmed}". Supported: ${SUPPORTED_LANGUAGES.join(", ")}`
      );
    }

    return new RestaurantLanguage(trimmed);
  }

  static reconstitute(value: string): RestaurantLanguage {
    return new RestaurantLanguage(value);
  }

  static defaultEN(): RestaurantLanguage {
    return new RestaurantLanguage("en");
  }

  equals(other: RestaurantLanguage): boolean {
    return this.value === other.value;
  }
}
