/**
 * Minimal axios-compatible HTTP client built on Node's global `fetch`
 * (stable since Node 18). It reproduces just the surface this project relies
 * on so the Magento clients and their call sites stay unchanged:
 *
 *   - instance methods: get(url), post(url, data), put(url, data), delete(url, {data})
 *   - resolves to `{ data, status, statusText, headers }` with `data` parsed as JSON
 *   - rejects on non-2xx with an error carrying `err.response.{data,status,statusText}`
 *   - JSON-serialises request bodies and sets `Content-Type: application/json`
 */

const request = async (baseURL, defaultHeaders, method, url, config = {}) => {
    const { data, headers } = config || {};
    const hasBody = data !== undefined && data !== null;

    const response = await fetch(baseURL + url, {
        method,
        headers: {
            ...defaultHeaders,
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
        },
        body: hasBody ? JSON.stringify(data) : undefined,
    });

    // Read the body once, preferring JSON but tolerating empty/plain responses.
    const text = await response.text();
    let body = text;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            /* leave `body` as the raw string */
        }
    }

    if (!response.ok) {
        const error = new Error(`Request failed with status code ${response.status}`);
        error.response = {
            data: body,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
        throw error;
    }

    return {
        data: body,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    };
};

/**
 * @param {{baseURL?: string, headers?: Record<string, string>}} options
 */
const createClient = ({ baseURL = '', headers = {} } = {}) => ({
    get: (url, config) => request(baseURL, headers, 'GET', url, config),
    post: (url, data, config) => request(baseURL, headers, 'POST', url, { ...config, data }),
    put: (url, data, config) => request(baseURL, headers, 'PUT', url, { ...config, data }),
    delete: (url, config) => request(baseURL, headers, 'DELETE', url, config),
});

module.exports = { createClient };
