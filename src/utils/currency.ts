export function getLocalPrice(countryCode: string | null) {
  // Default to USD if we can't detect the country
  if (!countryCode) return { price: '$19', currency: 'USD' };

  switch (countryCode.toUpperCase()) {
    case 'NG': // Nigeria
      return { price: '₦20,000', currency: 'NGN' };
    case 'ZA': // South Africa
      return { price: 'R350', currency: 'ZAR' };
    case 'GB': // United Kingdom
      return { price: '£15', currency: 'GBP' };
    case 'DE': // Germany
    case 'FR': // France
    case 'ES': // Spain
    case 'IT': // Italy
      return { price: '€18', currency: 'EUR' };
    case 'US': // United States
    case 'CA': // Canada
    default:
      return { price: '$19', currency: 'USD' };
  }
}