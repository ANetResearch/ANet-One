import type {
  ProviderEndpointRoutingDecision,
  ProviderEndpointRoutingPort,
} from "@anet/contracts";

const HTTPS_DEFAULT_PORT = "443";
const ROOT_PATH = "/";
/**
 * upstream 地址 -> 网关路径 的改写表。
 *
 * 上游在这里写死两个厂商的 upstream 地址。本分发不内置任何厂商地址,内置表为空,
 * 请求保持调用方配置的地址不变。表作为参数而不是模块常量,二次分发可以传入自己的
 * 改写表,改写逻辑(只认 https、hostname 大小写、默认端口 443、忽略结尾斜杠)也因此
 * 仍然可以被测试覆盖。
 *
 * 键的格式由 buildEndpointRoutingKey 决定,必须用它构造,不要手写拼接。
 */
const BUILTIN_GATEWAY_PATH_BY_ENDPOINT: ReadonlyMap<string, string> = new Map();

/** 把一个 upstream 地址归一成改写表的键;无法解析或非 https 时返回 undefined。 */
export function buildEndpointRoutingKey(requestUrl: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:") return undefined;
  const path =
    parsed.pathname === ROOT_PATH ? ROOT_PATH : parsed.pathname.replace(/\/+$/u, "") || ROOT_PATH;
  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}:${parsed.port || HTTPS_DEFAULT_PORT}${path}`;
}

/** 静态实现只提供 URL 决策；Host 清理、请求与响应透传由公共 fetch wrapper 负责。 */
export function createStaticProviderEndpointRoutingPort(
  endpointOrigin: string,
  gatewayPathByEndpoint: ReadonlyMap<string, string> = BUILTIN_GATEWAY_PATH_BY_ENDPOINT,
): ProviderEndpointRoutingPort {
  return {
    async resolve(requestUrl): Promise<ProviderEndpointRoutingDecision> {
      const key = buildEndpointRoutingKey(requestUrl);
      if (!key) return { routed: false, url: requestUrl };
      const targetPath = gatewayPathByEndpoint.get(key);
      if (!targetPath) return { routed: false, url: requestUrl };
      const target = new URL(targetPath, endpointOrigin);
      target.search = new URL(requestUrl).search;
      return { routed: true, url: target.href };
    },
  };
}
