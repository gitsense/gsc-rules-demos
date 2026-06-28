export function normalizeVendorInput(input) {
  // Validate input exists and is not null
  if (input === null || input === undefined) {
    throw new Error('Vendor input cannot be null or undefined');
  }

  // If input is a string, normalize it
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      throw new Error('Vendor input string cannot be empty');
    }
    return trimmed;
  }

  // If input is an object, validate and normalize
  if (typeof input === 'object') {
    const normalized = {};

    // Copy and validate each property
    for (const [key, value] of Object.entries(input)) {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Trim strings
      if (typeof value === 'string') {
        normalized[key] = value.trim();
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  // For other types (number, boolean), return as-is
  return input;
}
