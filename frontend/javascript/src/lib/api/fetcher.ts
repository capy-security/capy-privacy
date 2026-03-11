import config from '../config';

export interface CapySecurityApi<T> {
    success: boolean;
    message: string;
    data: T;
}

export const login = async <T,>(
    path: string,
    email: string,
    password: string,
    parameters?: any
): Promise<CapySecurityApi<T>> => {
    const auth = { 'email': email, 'password': password };
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Content-Length": String(JSON.stringify(auth).length)
    };
    const suffix = parameters ? `?${new URLSearchParams(parameters).toString()}` : "";
    const url = `${config.apiUrl}${path}${suffix}`;
    console.log(`[login] ${url}`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(auth)
        });
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const json = await response.json() as CapySecurityApi<any>;
        if (!json.success) {
            throw new Error(`API error: ${json.message}`);
        }
        return json as CapySecurityApi<T>;
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
};

