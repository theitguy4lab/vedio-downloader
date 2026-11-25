import { validateSafeUrl } from '../utils/urlValidator.js';
import { adapterRegistry } from '../adapters/index.js';
import { MediaInspectionResult, SourceInfo } from '../adapters/base.adapter.js';
import { AppError } from '../middlewares/errorHandler.js';

export class InspectionService {
  public static async inspectUrl(rawUrl: string): Promise<MediaInspectionResult> {
    // 1. SSRF & Protocol Safety Gate
    const validated = await validateSafeUrl(rawUrl);

    // 2. Source Adapter Resolution
    const adapter = adapterRegistry.findAdapterForUrl(validated.originalUrl);
    if (!adapter) {
      throw new AppError(
        'No compatible source adapter found for this URL. The initial release supports direct media URLs.',
        422,
        'UNSUPPORTED_SOURCE'
      );
    }

    // 3. Delegate to Adapter Inspection
    return adapter.inspect(validated);
  }

  public static listSources(): SourceInfo[] {
    return adapterRegistry.listSupportedSources();
  }
}
