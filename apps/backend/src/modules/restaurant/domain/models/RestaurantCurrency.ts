const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const KNOWN_CURRENCIES: readonly string[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "HKD",
  "SGD",
  "INR",
  "MXN",
  "BRL",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "ZAR",
  "TRY",
  "BGN",
  "CZK",
  "HUF",
  "PLN",
  "RON",
  "ILS",
  "AED",
  "SAR",
  "THB",
  "VND",
];

export class RestaurantCurrency {
  private constructor(public readonly value: string) {}

  static create(value: string): RestaurantCurrency {
    const normalized = value.trim().toUpperCase();

    if (!CURRENCY_PATTERN.test(normalized)) {
      throw new Error("Restaurant currency must be a 3-letter ISO 4217 code");
    }

    if (!KNOWN_CURRENCIES.includes(normalized)) {
      throw new Error(
        `Unsupported currency "${normalized}". Must be a supported ISO 4217 currency code`
      );
    }

    return new RestaurantCurrency(normalized);
  }

  static reconstitute(value: string): RestaurantCurrency {
    return new RestaurantCurrency(value.toUpperCase());
  }

  static defaultUSD(): RestaurantCurrency {
    return new RestaurantCurrency("USD");
  }

  equals(other: RestaurantCurrency): boolean {
    return this.value === other.value;
  }
}
