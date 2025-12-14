import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    const { rows } = await sql`SELECT * FROM technicians`;
    return response.status(200).json(rows);
  }

  if (request.method === 'POST') {
    const { id, name, role, initials } = request.body;
    await sql`INSERT INTO technicians (id, name, role, initials) VALUES (${id}, ${name}, ${role}, ${initials})`;
    return response.status(200).json({ id, name, role, initials });
  }

  if (request.method === 'DELETE') {
    const { id } = request.query;
    await sql`DELETE FROM technicians WHERE id = ${id}`;
    return response.status(200).json({ message: 'Deleted' });
  }
}