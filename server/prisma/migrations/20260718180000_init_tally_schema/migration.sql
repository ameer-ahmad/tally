-- CreateSchema
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "metric_entries" (
    "id" TEXT NOT NULL,
    "metric_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "metric_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active_days" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "habit_completions" (
    "id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "metrics_user_id_idx" ON "metrics"("user_id");
CREATE INDEX "metric_entries_metric_id_idx" ON "metric_entries"("metric_id");
CREATE INDEX "habits_user_id_idx" ON "habits"("user_id");
CREATE INDEX "habit_completions_habit_id_idx" ON "habit_completions"("habit_id");

CREATE UNIQUE INDEX "metric_entries_metric_id_date_key" ON "metric_entries"("metric_id", "date");
CREATE UNIQUE INDEX "habit_completions_habit_id_date_key" ON "habit_completions"("habit_id", "date");

ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
