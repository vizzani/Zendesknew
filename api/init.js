import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    // Crea tabella Tecnici
    await sql`
      CREATE TABLE IF NOT EXISTS technicians (
        id varchar(255) PRIMARY KEY,
        name varchar(255),
        role varchar(255),
        initials varchar(10)
      );
    `;

    // Crea tabella Richieste (Ferie/Permessi)
    await sql`
      CREATE TABLE IF NOT EXISTS requests (
        id varchar(255) PRIMARY KEY,
        techId varchar(255),
        startDate varchar(255),
        endDate varchar(255),
        type varchar(50),
        slot varchar(50),
        hours int,
        description text
      );
    `;

    return response.status(200).json({ message: 'Database tables created successfully' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}