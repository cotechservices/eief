// app/api/utilisateurs/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM utilisateurs ORDER BY id LIMIT 10');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, email, password, role } = body;
    
    const result = await query(
      'INSERT INTO utilisateurs (nom, prenom, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nom, prenom, email, password, role]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}