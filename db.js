
// --- Configuration ---
const DB_KEYS = {
    TECHS: 'zendesk_app_techs_v2', // Updated version key
    REQUESTS: 'zendesk_app_requests_v2'
};

// --- Default Data (Seed) ---
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

// --- Database API (Simulated Backend) ---
export const db = {
    technicians: {
        list: async () => {
            await delay(300); // Simulate network latency
            const data = localStorage.getItem(DB_KEYS.TECHS);
            if (!data) {
                // Initialize defaults if empty
                localStorage.setItem(DB_KEYS.TECHS, JSON.stringify(SEED_TECHNICIANS));
                return [...SEED_TECHNICIANS];
            }
            return JSON.parse(data);
        },
        add: async (tech) => {
            await delay(200);
            const current = JSON.parse(localStorage.getItem(DB_KEYS.TECHS) || '[]');
            const updated = [...current, tech];
            localStorage.setItem(DB_KEYS.TECHS, JSON.stringify(updated));
            return tech;
        },
        remove: async (id) => {
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
        },
        // Optional: Add remove request if needed in future
    }
};
