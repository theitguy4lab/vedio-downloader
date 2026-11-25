import dns from 'dns/promises';
import { URL } from 'url';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Checks if an IPv4 address is within private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local / AWS / Azure / GCP Metadata IP: 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network RFC 1918)
  if (a === 192 && b === 168) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && parts[2] === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved for Future Use)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is within loopback, link-local, or unique local ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    return isPrivateIPv4(ipv4Part);
  }

  // Unique local address fc00::/7 (fc00:: - fdff::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local address fe80::/10 (fe80:: - febf::)
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  return false;
}

export interface ValidatedUrl {
  originalUrl: string;
  parsedUrl: URL;
  resolvedIp: string;
  hostname: string;
}

/**
 * Validates a target media URL against SSRF threats and ensures protocol compliance.
 */
export async function validateSafeUrl(rawUrl: string): Promise<ValidatedUrl> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new AppError('Invalid URL format', 400, 'INVALID_URL_FORMAT');
  }

  // 1. Enforce allowed protocols strictly
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError(
      `Protocol '${parsed.protocol}' is not allowed. Only HTTP and HTTPS are permitted.`,
      400,
      'PROHIBITED_PROTOCOL'
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject obvious loopback names and empty hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === ''
  ) {
    throw new AppError('Access to internal or loopback hostnames is prohibited', 403, 'SSRF_BLOCKED');
  }

  // 3. DNS Resolution to verify resolved IP is strictly public
  let resolvedIp: string;
  try {
    // If hostname is already an IP, lookup returns it directly
    const lookup = await dns.lookup(hostname);
    resolvedIp = lookup.address;
  } catch (err: any) {
    throw new AppError(
      `Failed to resolve hostname '${hostname}': ${err.message}`,
      400,
      'DNS_RESOLUTION_FAILED'
    );
  }

  // 4. Validate IP safety
  const isIPv6 = resolvedIp.includes(':');
  const isUnsafe = isIPv6 ? isPrivateIPv6(resolvedIp) : isPrivateIPv4(resolvedIp);

  if (isUnsafe) {
    throw new AppError(
      'Target IP address resolves to a private, loopback, or reserved network range.',
      403,
      'SSRF_BLOCKED'
    );
  }

  return {
    originalUrl: rawUrl,
    parsedUrl: parsed,
    resolvedIp,
    hostname,
  };
}
