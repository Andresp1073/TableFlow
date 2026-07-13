const VALID_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
  "zh",
  "ko",
  "ar",
  "ru",
  "nl",
] as const;

export type PreferredLanguageValue = (typeof VALID_LANGUAGES)[number];

export class PreferredLanguage {
  private constructor(public readonly value: PreferredLanguageValue) {}

  static create(value: string): PreferredLanguage {
    const normalized = value.trim().toLowerCase();
    if (!VALID_LANGUAGES.includes(normalized as PreferredLanguageValue)) {
      throw new Error(
        `Invalid language "${value}". Allowed: ${VALID_LANGUAGES.join(", ")}`,
      );
    }
    return new PreferredLanguage(normalized as PreferredLanguageValue);
  }

  static reconstitute(value: string): PreferredLanguage {
    return new PreferredLanguage(value as PreferredLanguageValue);
  }

  equals(other: PreferredLanguage): boolean {
    return this.value === other.value;
  }

  static readonly ENGLISH = "en" as const;
  static readonly SPANISH = "es" as const;
  static readonly FRENCH = "fr" as const;
  static readonly GERMAN = "de" as const;
  static readonly ITALIAN = "it" as const;
  static readonly PORTUGUESE = "pt" as const;
  static readonly JAPANESE = "ja" as const;
  static readonly CHINESE = "zh" as const;
  static readonly KOREAN = "ko" as const;
  static readonly ARABIC = "ar" as const;
  static readonly RUSSIAN = "ru" as const;
  static readonly DUTCH = "nl" as const;
}
