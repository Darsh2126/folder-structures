import type { WrapperManifest } from "./types.js";

export interface ResolutionResult {
  selected: WrapperManifest[];
  errors: string[];
  warnings: string[];
}

export function resolveWrappers(
  requestedTags: string[],
  available: WrapperManifest[],
  target: string
): ResolutionResult {
  const result: ResolutionResult = {
    selected: [],
    errors: [],
    warnings: [],
  };

  const selectedMap = new Map<string, WrapperManifest>();
  const queue = [...requestedTags];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const tag = queue.shift()!;
    if (visited.has(tag)) continue;
    visited.add(tag);

    const wrapper = available.find((w) => w.tag === tag);
    if (!wrapper) {
      result.errors.push(`Wrapper "${tag}" not found`);
      continue;
    }

    if (!wrapper.targets.includes(target)) {
      result.warnings.push(`"${tag}" has no target "${target}" — may not work correctly`);
    }

    selectedMap.set(tag, wrapper);

    for (const dep of wrapper.needs) {
      if (!visited.has(dep)) {
        result.warnings.push(`Auto-adding "${dep}" (needed by "${tag}")`);
        queue.push(dep);
      }
    }
  }

  const selected = Array.from(selectedMap.values());

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i];
      const b = selected[j];
      if (a.conflicts.includes(b.tag) || b.conflicts.includes(a.tag)) {
        result.errors.push(
          `"${a.tag}" conflicts with "${b.tag}" — cannot use both`
        );
      }
    }
  }

  result.selected = selected;
  return result;
}
