import { BaseAdapter, SourceInfo } from './base.adapter.js';
import { DirectUrlAdapter } from './direct.adapter.js';

class AdapterRegistry {
  private adapters: BaseAdapter[] = [];

  constructor() {
    this.register(new DirectUrlAdapter());
  }

  register(adapter: BaseAdapter): void {
    this.adapters.push(adapter);
  }

  findAdapterForUrl(url: string): BaseAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.supports(url)) {
        return adapter;
      }
    }
    return null;
  }

  listSupportedSources(): SourceInfo[] {
    return this.adapters.map((a) => a.getInfo());
  }
}

export const adapterRegistry = new AdapterRegistry();
