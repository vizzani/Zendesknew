/**
 * DB ABSTRACTION LAYER - HYBRID VERSION
 * Tenta di connettersi alle API Serverless (Vercel Postgres).
 * Se fallisce (es. DB non configurato o offline), usa LocalStorage come fallback.
 */

const LOCAL_STORAGE_KEYS = {
    TECHS: 'technicians_data',
    REQS: 'requests_data'
};

// Helper per LocalStorage (Fallback)
const local = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    add: (key, item) => {
        const data = local.get(key);
        data.push(item);
        local.set(key, data);
        return item;
    },
    remove: (key, id) => {
        const data = local.get(key).filter(i => i.id !== id);
        local.set(key, data);
        return id;
    }
};

export const db = {
    technicians: {
        list: async () => {
            try {
                const res = await fetch('/api/technicians');
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return await res.json();
            } catch (error) {
                console.warn("Database Vercel non raggiungibile, uso LocalStorage:", error);
                return local.get(LOCAL_STORAGE_KEYS.TECHS);
            }
        },
        add: async (tech) => {
            try {
                const res = await fetch('/api/technicians', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tech)
                });
                if (!res.ok) throw new Error('API Error');
                return await res.json();
            } catch (error) {
                console.warn("Salvataggio su DB fallito, uso LocalStorage");
                return local.add(LOCAL_STORAGE_KEYS.TECHS, tech);
            }
        },
        remove: async (id) => {
            try {
                const res = await fetch(`/api/technicians?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('API Error');
                return id;
            } catch (error) {
                return local.remove(LOCAL_STORAGE_KEYS.TECHS, id);
            }
        }
    },
    requests: {
        list: async () => {
            try {
                const res = await fetch('/api/requests');
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return await res.json();
            } catch (error) {
                console.warn("Database Vercel non raggiungibile, uso LocalStorage:", error);
                return local.get(LOCAL_STORAGE_KEYS.REQS);
            }
        },
        add: async (req) => {
            try {
                const res = await fetch('/api/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req)
                });
                if (!res.ok) throw new Error('API Error');
                return await res.json();
            } catch (error) {
                console.warn("Salvataggio su DB fallito, uso LocalStorage");
                return local.add(LOCAL_STORAGE_KEYS.REQS, req);
            }
        }
    }
};
