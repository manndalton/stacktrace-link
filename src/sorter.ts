import { StackFrame } from './parser';

export type SortField = 'file' | 'line' | 'function' | 'index';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export function parseSortConfig(raw: string): SortConfig {
  const [field, order] = raw.split(':');
  const validFields: SortField[] = ['file', 'line', 'function', 'index'];
  const validOrders: SortOrder[] = ['asc', 'desc'];
  if (!validFields.includes(field as SortField)) {
    throw new Error(`Invalid sort field: ${field}. Must be one of ${validFields.join(', ')}`);
  }
  const resolvedOrder: SortOrder = validOrders.includes(order as SortOrder) ? (order as SortOrder) : 'asc';
  return { field: field as SortField, order: resolvedOrder };
}

export function sortFrames(frames: StackFrame[], config: SortConfig): StackFrame[] {
  const sorted = [...frames];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (config.field) {
      case 'file':
        cmp = (a.file ?? '').localeCompare(b.file ?? '');
        break;
      case 'line':
        cmp = (a.line ?? 0) - (b.line ?? 0);
        break;
      case 'function':
        cmp = (a.fn ?? '').localeCompare(b.fn ?? '');
        break;
      case 'index':
        cmp = (a.index ?? 0) - (b.index ?? 0);
        break;
    }
    return config.order === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function sortByMultiple(frames: StackFrame[], configs: SortConfig[]): StackFrame[] {
  if (configs.length === 0) return frames;
  const sorted = [...frames];
  sorted.sort((a, b) => {
    for (const config of configs) {
      const single = sortFrames([a, b], config);
      if (single[0] !== a) return config.order === 'desc' ? 1 : -1;
      if (single[1] !== b) return config.order === 'desc' ? -1 : 1;
    }
    return 0;
  });
  return sorted;
}
