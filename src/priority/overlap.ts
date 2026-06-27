// Priority overlap test file
// Multiple rules match this file to test priority ordering

export interface Config {
  name: string;
  value: unknown;
  priority: number;
  tags: string[];
}

export function sortConfigs(configs: Config[]): Config[] {
  return [...configs].sort((a, b) => b.priority - a.priority);
}

export function filterByTag(configs: Config[], tag: string): Config[] {
  return configs.filter(c => c.tags.includes(tag));
}

export function mergeConfigs(base: Config, override: Config): Config {
  return {
    name: override.name || base.name,
    value: override.value ?? base.value,
    priority: Math.max(base.priority, override.priority),
    tags: [...new Set([...base.tags, ...override.tags])],
  };
}

export function validateConfig(config: unknown): config is Config {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.name === 'string' &&
    typeof c.priority === 'number' &&
    Array.isArray(c.tags) &&
    c.tags.every((t: unknown) => typeof t === 'string')
  );
}
