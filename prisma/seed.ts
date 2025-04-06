import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CsvRow {
  Settimana: string;
  Giorno: string;
  Pasto: string;
  Variante: string;
  Descrizione: string;
}

async function main() {
  console.log('Start seeding...');

  const csvFilePath = path.resolve(__dirname, '../seeds/dieta_primaverile_4_settimane.csv');
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  // Cache per evitare query ripetute per lo stesso dato
  const weekCache: Record<string, number> = {};
  const dayCache: Record<string, number> = {};
  const mealCache: Record<string, number> = {};
  const recipeCache: Record<string, number> = {};

  // Configura il parser CSV
  const parser = parse(fileContent, {
    columns: true, // Usa la prima riga come header
    skip_empty_lines: true,
    trim: true,
  });

  let recordCount = 0;

  for await (const record of parser) {
    const row = record as CsvRow;
    recordCount++;
    console.log(`Processing record ${recordCount}: ${row.Giorno} - ${row.Pasto}`);

    // 1. Gestisci Week (Identificata dalla colonna "Settimana")
    const weekIdentifier = row.Settimana || 'Settimana Unica'; // Usa un default se vuoto
    let weekId = weekCache[weekIdentifier];
    if (!weekId) {
      const week = await prisma.week.upsert({
        where: { id: -1 }, // Usa un ID non valido per forzare la creazione se non esiste un identificatore univoco affidabile
        // Se avessimo un identificatore univoco dalla colonna "Settimana", potremmo usarlo qui:
        // where: { weekIdentifier: weekIdentifier },
        update: {},
        create: {
          // weekIdentifier: weekIdentifier // Se volessimo salvarlo
        },
      });
      weekId = week.id;
      weekCache[weekIdentifier] = weekId;
      console.log(`  Upserted Week: ID ${weekId} (Identifier: ${weekIdentifier})`);
    } else {
        console.log(`  Found Week in cache: ID ${weekId}`);
    }


    // 2. Gestisci Day (Nome del giorno) - Associato alla Week
    const dayName = row.Giorno;
    const dayCacheKey = `${weekId}-${dayName}`; // Chiave cache basata su weekId e nome giorno
    let dayId = dayCache[dayCacheKey];
    if (!dayId) {
      // Nota: @unique su Day.name nello schema potrebbe causare problemi se lo stesso giorno
      // appare in settimane diverse. Rimosso l'@unique o usiamo una chiave composta.
      // Per ora, cerchiamo per nome E weekId.
      let day = await prisma.day.findFirst({
          where: {
              name: dayName,
              weekId: weekId,
          }
      });
      if (!day) {
          day = await prisma.day.create({
            data: {
              name: dayName,
              weekId: weekId,
            },
          });
          console.log(`  Created Day: ID ${day.id} (Name: ${dayName}, WeekID: ${weekId})`);
      } else {
          console.log(`  Found Day: ID ${day.id} (Name: ${dayName}, WeekID: ${weekId})`);
      }

      dayId = day.id;
      dayCache[dayCacheKey] = dayId;
    } else {
        console.log(`  Found Day in cache: ID ${dayId}`);
    }


    // 3. Gestisci Meal (Nome del pasto)
    const mealName = row.Pasto;
    let mealId = mealCache[mealName];
    if (!mealId) {
      const meal = await prisma.meal.upsert({
        where: { name: mealName },
        update: {},
        create: { name: mealName },
      });
      mealId = meal.id;
      mealCache[mealName] = mealId;
      console.log(`  Upserted Meal: ID ${mealId} (Name: ${mealName})`);
    } else {
        console.log(`  Found Meal in cache: ID ${mealId}`);
    }


    // 4. Gestisci Recipe (Descrizione)
    // Usiamo la descrizione come identificatore unico per la ricetta
    const recipeDescription = row.Descrizione;
    let recipeId = recipeCache[recipeDescription];
    if (!recipeId) {
        // Cerca se esiste già una ricetta con questa descrizione
        let recipe = await prisma.recipe.findFirst({
            where: { description: recipeDescription }
        });
        if (!recipe) {
            recipe = await prisma.recipe.create({
                data: { description: recipeDescription },
            });
            console.log(`  Created Recipe: ID ${recipe.id} (Desc: ${recipeDescription.substring(0, 30)}...)`);
        } else {
            console.log(`  Found Recipe: ID ${recipe.id} (Desc: ${recipeDescription.substring(0, 30)}...)`);
        }
        recipeId = recipe.id;
        recipeCache[recipeDescription] = recipeId;
    } else {
        console.log(`  Found Recipe in cache: ID ${recipeId}`);
    }


    // 5. Crea MealOption collegando Day, Meal, Recipe
    // Aggiungiamo un controllo per evitare duplicati basati su day, meal, recipe e variante
    const existingMealOption = await prisma.mealOption.findFirst({
        where: {
            dayId: dayId,
            mealId: mealId,
            recipeId: recipeId,
            variant: row.Variante || null // Assicura che il null/undefined sia gestito correttamente
        }
    });

    if (!existingMealOption) {
        const mealOption = await prisma.mealOption.create({
            data: {
            dayId: dayId,
            mealId: mealId,
            recipeId: recipeId,
            variant: row.Variante || null, // Usa null se la variante è vuota/undefined
            },
        });
        console.log(`  Created MealOption: ID ${mealOption.id} (Variant: ${row.Variante || 'N/A'})`);
    } else {
        console.log(`  Skipped duplicate MealOption: (Day: ${dayId}, Meal: ${mealId}, Recipe: ${recipeId}, Variant: ${row.Variante || 'N/A'})`);
    }

  } // Fine ciclo for await

  console.log(`Seeding finished. Processed ${recordCount} records.`);
}

main()
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 