-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weekId" INTEGER NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealOption" (
    "id" SERIAL NOT NULL,
    "variant" TEXT,
    "dayId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "MealOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Day_name_key" ON "Day"("name");

-- CreateIndex
CREATE INDEX "Day_weekId_idx" ON "Day"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Meal_name_key" ON "Meal"("name");

-- CreateIndex
CREATE INDEX "MealOption_dayId_idx" ON "MealOption"("dayId");

-- CreateIndex
CREATE INDEX "MealOption_mealId_idx" ON "MealOption"("mealId");

-- CreateIndex
CREATE INDEX "MealOption_recipeId_idx" ON "MealOption"("recipeId");

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealOption" ADD CONSTRAINT "MealOption_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealOption" ADD CONSTRAINT "MealOption_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealOption" ADD CONSTRAINT "MealOption_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
