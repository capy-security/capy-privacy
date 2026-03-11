import { g as get, w as writable } from "./index.js";
import { jwtDecode } from "jwt-decode";
const config = {
  apiUrl: "https://api.capysecurity.com/"
};
function getErrorMessage(apiResponse, defaultMessage = "An error occurred") {
  if (!apiResponse) {
    return defaultMessage;
  }
  const message = apiResponse.message || defaultMessage;
  const detail = apiResponse.data?.detail;
  if (detail) {
    return `${message}: ${detail}`;
  }
  return message;
}
const fetchApi = async (url, options = {}) => {
  const baseUrl = config.apiUrl.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${baseUrl}${path}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: `HTTP error: ${response.status}`, status: response.status };
  }
  if (!response.ok) {
    const message = getErrorMessage(data, `Request failed (${response.status})`);
    throw new Error(message);
  }
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    const message = getErrorMessage(data, "Request failed");
    throw new Error(message);
  }
  return {
    status: response.status,
    data,
    headers: response.headers
  };
};
const getGetUserTokenAuthTokenPostUrl = () => {
  return `/auth/token/`;
};
const getUserTokenAuthTokenPost = async (loginRequest, options) => {
  return fetchApi(
    getGetUserTokenAuthTokenPostUrl(),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        loginRequest
      )
    }
  );
};
const emptyUser = {
  status: "invalid",
  authenticated: false,
  token: null,
  profile: null
};
function decodeToken(token) {
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) {
      return null;
    }
    return {
      id: decoded.sub || "",
      email: decoded.email || "",
      display_name: decoded.display_name || decoded.sub || "",
      role: decoded.role ?? 0,
      expires_at: new Date(decoded.exp * 1e3)
    };
  } catch (error) {
    console.error("[authorization] Failed to decode token:", error);
    return null;
  }
}
function isTokenExpired(expiresAt) {
  const now = /* @__PURE__ */ new Date();
  const bufferMs = 30 * 1e3;
  return expiresAt.getTime() <= now.getTime() + bufferMs;
}
function validateToken(user) {
  if (!user.token || !user.profile) {
    return "invalid";
  }
  if (isTokenExpired(user.profile.expires_at)) {
    return "expired";
  }
  return "valid";
}
function loadUser() {
  return emptyUser;
}
function saveUser(user) {
  return;
}
function createAuthStore() {
  const baseStore = writable(loadUser());
  return {
    // subscribe: validatedStore.subscribe,
    subscribe: baseStore.subscribe,
    /**
     * Login function - get token and decode it
     */
    login: async (email, password) => {
      try {
        const response = await getUserTokenAuthTokenPost({
          email,
          password
        });
        if (response.status !== 200) {
          const errorData = response.data;
          let errorMessage = "Login failed";
          if (errorData && typeof errorData === "object") {
            if ("success" in errorData && "message" in errorData) {
              errorMessage = getErrorMessage(errorData, "Login failed");
            } else if ("message" in errorData && typeof errorData.message === "string") {
              errorMessage = errorData.message;
            } else if ("detail" in errorData && typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            }
          }
          throw new Error(errorMessage);
        }
        const apiResponse = response.data;
        const token = apiResponse?.data?.token;
        if (!token) {
          throw new Error("No token received from server");
        }
        const profile = decodeToken(token);
        if (!profile) {
          throw new Error("Failed to decode token");
        }
        const user = {
          status: "valid",
          authenticated: true,
          token,
          profile
        };
        baseStore.set(user);
        saveUser(user);
      } catch (error) {
        baseStore.set(emptyUser);
        throw error;
      }
    },
    /**
     * Logout function
     */
    logout: () => {
      baseStore.set(emptyUser);
    },
    /**
     * Update token validity - check if not expired or invalid
     */
    checkTokenValidity: () => {
      const currentUser = get(baseStore);
      if (currentUser.token && currentUser.profile) {
        const status = validateToken(currentUser);
        const updatedUser = {
          ...currentUser,
          status,
          authenticated: status === "valid"
        };
        baseStore.set(updatedUser);
      } else if (currentUser.authenticated) {
        baseStore.set(emptyUser);
      }
    }
  };
}
const authorizationStore = createAuthStore();
export {
  authorizationStore as a,
  fetchApi as f
};
