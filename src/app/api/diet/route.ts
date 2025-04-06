import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Inizializza Prisma Client
// È buona pratica istanziarlo fuori dall'handler per riutilizzare la connessione
// tra le richieste in ambienti serverless (come Vercel/Next.js API routes)
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In sviluppo, evita di creare nuove connessioni ad ogni hot-reload
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export async function GET(request: Request) {
  console.log('Received GET request for /api/diet');
  try {
    // Recupera tutte le settimane includendo i dati correlati
    const weeks = await prisma.week.findMany({
      orderBy: {
        // Ordina per ID o altro campo identificativo se lo avessimo
        id: 'asc',
      },
      include: {
        days: {
          orderBy: {
            // Potremmo ordinare per un campo 'order' o 'dayOfWeek' se lo aggiungessimo
            // Per ora ordiniamo per ID che dovrebbe seguire l'ordine di inserimento
            id: 'asc', // O potremmo ordinare per 'name' se i nomi sono consistenti (Lun, Mar...)
          },
          include: {
            mealOptions: {
              orderBy: [
                 // Ordina prima per tipo di pasto (es. Colazione, Pranzo...), poi per variante
                { meal: {
                    id: 'asc' // O name: 'asc' se più leggibile
                }},
                { variant: 'asc' },
              ],
              include: {
                meal: true,   // Includi i dettagli del pasto (nome)
                recipe: true, // Includi i dettagli della ricetta (descrizione)
              },
            },
          },
        },
      },
    });

    console.log(`Successfully fetched ${weeks.length} weeks.`);

    // Restituisci i dati come JSON
    return NextResponse.json(weeks);

  } catch (error) {
    console.error('Error fetching diet data:', error);

    // Restituisci un errore 500
    return NextResponse.json(
      { error: 'Failed to fetch diet data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    // In ambienti non serverless potresti disconnettere qui,
    // ma nelle API route di Next.js di solito si lascia gestire al framework.
    // await prisma.$disconnect();
  }
}

// Aggiungi un type a global per TypeScript
declare global {
  var prisma: PrismaClient | undefined;
} 