-- Run this in the Supabase SQL editor

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date unique not null,
  weight_kg numeric,
  water_ml integer,
  sleep_hours numeric,
  energy smallint check (energy between 1 and 5),
  hunger smallint check (hunger between 1 and 5),
  workout_status text check (workout_status in ('done', 'partial', 'missed', 'rest')),
  workout_notes text,
  soreness_notes text,
  created_at timestamptz default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  log_date date not null references daily_logs(log_date) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  description text not null,
  on_plan boolean not null
);

create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  measured_at date unique not null,
  waist_cm numeric not null,
  chest_cm numeric not null,
  arm_cm numeric not null
);

-- Disable RLS — single-user app, access controlled via client-side login gate
alter table daily_logs disable row level security;
alter table meals disable row level security;
alter table measurements disable row level security;
