
/**
 * DB ABSTRACTION LAYER
 * 
 * Attualmente configurato per: CLIENT-SIDE PERSISTENCE (LocalStorage)
 * Ottimizzato per: Vercel Static Deployment (Single Page Application)
 * 
 * PER PASSARE A UN VERO BACKEND (Vercel Postgres / Supabase):
 * 1. Sostituire il contenuto dei metodi con chiamate `fetch`.
 *    Es: const response = await fetch('/api/technicians'); return response.json();
 */

const DB_KEYS = {
    TECHS: 'zendesk_app_techs_v2', 
    REQUESTS: 'zendesk_app_requests_v2'
};

// --- Seed Data (Dati Iniziali) ---
const SEED_TECHNICIANS = [
    { id: '1', name: 'Matteo Vizzani', role: 'IT Manager', initials: 'MV' },
    { id: '2', name: 'Peter Di Pasquantonio', role: 'System Admin', initials: 'PD' },
    { id: '3', name: 'Vittorio Spina', role: 'Helpdesk Specialist', initials: 'VS' },
    { id: '4', name: 'Daniel Baratti', role: 'Support Technician', initials: 'DB' },
];

const SEED_REQUESTS = [
    { 
        id: '101', 
        techId: '1', 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0], 
        type: 'ferie', 
        slot: 'full', 
        description: 'Ferie programmate' 
    },
];

// --- Helpers ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Repository Implementation ---
export const db = {
    technicians: {
        list: async () => {
            // VERCEL OPTIMIZATION NOTE: Replace this with `return await fetch('/api/technicians').then(r => r.json())`
            await delay(300); 
            const data = localStorage.getItem(DB_KEYS.TECHS);
            if (!data) {
                localStorage.setItem(DB_KEYS.TECHS, JSON.stringify(SEED_TECHNICIANS));
                return [...SEED_TECHNICIANS];
            }
            return JSON.parse(data);
        },
        add: async (tech) => {
             // VERCEL OPTIMIZATION NOTE: Replace with `await fetch('/api/technicians', { method: 'POST', body: JSON.stringify(tech) })`
            await delay(200);
            const current = JSON.parse(localStorage.getItem(DB_KEYS.TECHS) || '[]');
            const updated = [...current, tech];
            localStorage.setItem(DB_KEYS.TECHS, JSON.stringify(updated));
            return tech;
        },
        remove: async (id) => {
            // VERCEL OPTIMIZATION NOTE: Replace with `await fetch('/api/technicians/' + id, { method: 'DELETE' })`
            await delay(200);
            const current = JSON.parse(localStorage.getItem(DB_KEYS.TECHS) || '[]');
            const updated = current.filter(t => t.id !== id);
            localStorage.setItem(DB_KEYS.TECHS, JSON.stringify(updated));
            return id;
        }
    },
    requests: {
        list: async () => {
            await delay(300);
            const data = localStorage.getItem(DB_KEYS.REQUESTS);
            if (!data) {
                localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
                return [...SEED_REQUESTS];
            }
            return JSON.parse(data);
        },
        add: async (req) => {
            await delay(200);
            const current = JSON.parse(localStorage.getItem(DB_KEYS.REQUESTS) || '[]');
            const updated = [...current, req];
            localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(updated));
            return req;
        }
    }
};
