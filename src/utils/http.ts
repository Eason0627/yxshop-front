type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestConfig = Omit<RequestInit, "body" | "method"> & {
  url?: string;
  method?: RequestMethod | Lowercase<RequestMethod>;
  baseURL?: string;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
};

export type HttpResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
};

export type ApiError = {
  code: number;
  message: string;
};

/** 运行时 API 基础地址（读取 VITE_API_BASE_URL 环境变量，dev 回退 localhost） */
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") as string;
/** 文件上传端点 */
export const UPLOAD_URL = `${BASE_URL}/upload`;

const defaultBaseURL = BASE_URL;
const defaultTimeout = 5000;

const buildURL = (baseURL: string, url: string, params?: Record<string, unknown>) => {
  const isAbsolute = /^https?:\/\//i.test(url);
  const base = isAbsolute ? url : `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  const requestURL = new URL(base, window.location.origin);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    requestURL.searchParams.set(key, String(value));
  });

  return requestURL.toString();
};

const parseBody = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as Promise<T>;
};

const getErrorMessage = (status: number, serverMsg?: string) => {
  switch (status) {
    case 400: return serverMsg ? `参数错误：${serverMsg}` : "请求参数有误，请检查表单";
    case 401: return "登录已过期，请重新登录";
    case 403: return "您没有权限执行此操作";
    case 404: return "请求的资源不存在";
    case 409: return serverMsg || "数据冲突，请刷新后重试";
    case 429: return "请求过于频繁，请稍后再试";
    case 500: return serverMsg ? `服务器错误：${serverMsg}` : "服务器内部错误，请联系管理员";
    case 502: return "服务暂时不可用，请稍后重试";
    default:  return serverMsg || "网络错误，请检查网络连接";
  }
};

// 错误消息去重：避免同一条消息短时间内重复弹出
const _recentErrors = new Set<string>();
const showError = (msg: string) => {
  if (_recentErrors.has(msg)) return;
  _recentErrors.add(msg);
  setTimeout(() => _recentErrors.delete(msg), 3000);
  import('element-plus').then(({ ElMessage }) => ElMessage.error(msg)).catch(() => {});
};

const request = async <T = any>(urlOrConfig: string | RequestConfig, config: RequestConfig = {}): Promise<HttpResponse<T>> => {
  const mergedConfig: RequestConfig =
    typeof urlOrConfig === "string" ? { ...config, url: urlOrConfig } : { ...urlOrConfig };

  const {
    url = "",
    baseURL = defaultBaseURL,
    params,
    data,
    timeout = defaultTimeout,
    headers,
    method = "GET",
    ...fetchConfig
  } = mergedConfig;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const requestHeaders = new Headers(headers);
  const token = localStorage.getItem("token");

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(buildURL(baseURL, url, params), {
      ...fetchConfig,
      method: method.toUpperCase(),
      headers: requestHeaders,
      signal: controller.signal,
      body: data === undefined ? undefined : isFormData ? data : JSON.stringify(data),
    });

    const responseData = await parseBody<T>(response);

    if (!response.ok) {
      const errorData = responseData as { message?: string; msg?: string; error?: string };
      const serverMsg = errorData?.message || errorData?.msg || errorData?.error;
      const message = getErrorMessage(response.status, serverMsg);

      if (response.status === 401) {
        localStorage.removeItem('token');
        const isLoginPage = window.location.pathname === '/login';
        if (!isLoginPage) {
          showError('登录已过期，请重新登录');
          setTimeout(() => { window.location.href = '/login'; }, 1200);
        }
      } else {
        showError(message);
      }

      return Promise.reject({ code: response.status, message } satisfies ApiError);
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: mergedConfig,
    } satisfies HttpResponse<T>;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return Promise.reject(error);
    }
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "请求超时，请稍后重试"
      : "网络错误，请检查网络连接";
    showError(message);
    return Promise.reject({ code: 0, message } satisfies ApiError);
  } finally {
    window.clearTimeout(timer);
  }
};

const http = {
  request,
  get:    <T = any>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: "GET" }),
  delete: <T = any>(url: string, config?: RequestConfig) =>
    request<T>(url, { ...config, method: "DELETE" }),
  post:   <T = any>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>(url, { ...config, method: "POST", data }),
  put:    <T = any>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>(url, { ...config, method: "PUT", data }),
  patch:  <T = any>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>(url, { ...config, method: "PATCH", data }),
};

export type HttpClient = typeof http;

export const isHttpError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "message" in error;

export default http;
