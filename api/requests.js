import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    const { rows } = await sql`SELECT * FROM requests`;
    return response.status(200).json(rows);
  }

  if (request.method === 'POST') {
    const { id, techId, startDate, endDate, type, slot, hours, description } = request.body;
    await sql`
      INSERT INTO requests (id, techId, startDate, endDate, type, slot, hours, description) 
      VALUES (${id}, ${techId}, ${startDate}, ${endDate}, ${type}, ${slot}, ${hours || 0}, ${description})
    `;
    return response.status(200).json(request.body);
  }
}