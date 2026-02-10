/**
 * API helper — thin wrapper around fetch for the Flask backend.
 */

const BASE = "http://localhost:5000/api";

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
}

export function getTasks(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, v);
    });
    const qs = params.toString();
    return request(`/tasks${qs ? `?${qs}` : ""}`);
}

export function createTask(data) {
    return request("/tasks", { method: "POST", body: JSON.stringify(data) });
}

export function updateTask(id, data) {
    return request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteTask(id) {
    return request(`/tasks/${id}`, { method: "DELETE" });
}
