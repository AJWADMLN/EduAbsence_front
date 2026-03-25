import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { parse } from "dotenv";

const config = parse(readFileSync(".env.local", "utf-8"));
const supabase = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY);

const defaultUsers = [
  { id: "u1", nom: "Karim Bouali", email: "mlnedu2005@gmail.com", password: "admin123", role: "admin" },
];

const defaultEnseignants = [
  { id: "e1", ppr: "112233", nom: "Benkhelifa", prenom: "Mohamed", matiere: "Mathématiques", email: "m.benkhelifa@ecole.dz", telephone: "0550112233", sexe: "Masculin", cycle: "Lycée", etablissement: "Lycée Ibn Khaldoun", createdAt: "2024-09-01" },
  { id: "e2", ppr: "224455", nom: "Hamidi", prenom: "Fatima", matiere: "Physique", email: "f.hamidi@ecole.dz", telephone: "0661223344", sexe: "Féminin", cycle: "Collège", etablissement: "CEM El Amel", createdAt: "2024-09-01" },
  { id: "e3", ppr: "336677", nom: "Meziani", prenom: "Anis", matiere: "Français", email: "a.meziani@ecole.dz", telephone: "0770334455", sexe: "Masculin", cycle: "Primaire", etablissement: "École Ibn Badis", createdAt: "2024-09-01" },
  { id: "e4", ppr: "448899", nom: "Oussalem", prenom: "Nadia", matiere: "Histoire", email: "n.oussalem@ecole.dz", telephone: "0550445566", sexe: "Féminin", cycle: "Lycée", etablissement: "Lycée Emir Abdelkader", createdAt: "2024-09-02" },
  { id: "e5", ppr: "551122", nom: "Rahmani", prenom: "Yacine", matiere: "Informatique", email: "y.rahmani@ecole.dz", telephone: "0661556677", sexe: "Masculin", cycle: "Collège", etablissement: "CEM Chahid Boumaâraf", createdAt: "2024-09-02" },
  { id: "e6", ppr: "663344", nom: "Kaci", prenom: "Amina", matiere: "Arabe", email: "a.kaci@ecole.dz", telephone: "0770667788", sexe: "Féminin", cycle: "Primaire", etablissement: "École 1er Novembre", createdAt: "2024-09-03" },
];

const defaultAbsences = [
  { id: "a1",  enseignantId: "e1", date: "2026-01-06", periode: "matin", heures: 4, declareePar: "u2", createdAt: "2026-01-06" },
  { id: "a2",  enseignantId: "e2", date: "2026-01-08", periode: "soir",  heures: 3, declareePar: "u2", createdAt: "2026-01-08" },
  { id: "a3",  enseignantId: "e1", date: "2026-01-13", periode: "matin", heures: 2, declareePar: "u2", createdAt: "2026-01-13" },
  { id: "a4",  enseignantId: "e3", date: "2026-01-15", periode: "soir",  heures: 4, declareePar: "u2", createdAt: "2026-01-15" },
  { id: "a5",  enseignantId: "e4", date: "2026-01-20", periode: "matin", heures: 1, declareePar: "u2", createdAt: "2026-01-20" },
  { id: "a6",  enseignantId: "e5", date: "2026-01-22", periode: "soir",  heures: 4, declareePar: "u2", createdAt: "2026-01-22" },
  { id: "a7",  enseignantId: "e2", date: "2026-02-03", periode: "matin", heures: 3, declareePar: "u2", createdAt: "2026-02-03" },
  { id: "a8",  enseignantId: "e1", date: "2026-02-10", periode: "soir",  heures: 2, declareePar: "u2", createdAt: "2026-02-10" },
  { id: "a9",  enseignantId: "e6", date: "2026-02-17", periode: "matin", heures: 4, declareePar: "u2", createdAt: "2026-02-17" },
  { id: "a10", enseignantId: "e3", date: "2026-02-24", periode: "soir",  heures: 1, declareePar: "u2", createdAt: "2026-02-24" },
  { id: "a11", enseignantId: "e4", date: "2026-03-02", periode: "matin", heures: 3, declareePar: "u2", createdAt: "2026-03-02" },
];

const defaultEtablissements = [
  { id: "et1", nom: "École Ibn Badis", cycle: "Primaire", adresse: "Rue des Écoles, Alger", telephone: "023456789", createdAt: "2024-01-01" },
  { id: "et2", nom: "École 1er Novembre", cycle: "Primaire", adresse: "Avenue de l'Indépendance, Oran", telephone: "041234567", createdAt: "2024-01-01" },
  { id: "et3", nom: "CEM El Amel", cycle: "Collège", adresse: "Boulevard Mohamed V, Constantine", telephone: "031876543", createdAt: "2024-01-01" },
  { id: "et4", nom: "CEM Chahid Boumaâraf", cycle: "Collège", adresse: "Rue de la Liberté, Annaba", telephone: "038765432", createdAt: "2024-01-01" },
  { id: "et5", nom: "Lycée Ibn Khaldoun", cycle: "Lycée", adresse: "Place des Martyrs, Alger", telephone: "023987654", createdAt: "2024-01-01" },
  { id: "et6", nom: "Lycée Emir Abdelkader", cycle: "Lycée", adresse: "Rue Ahmed Bey, Oran", telephone: "041876543", createdAt: "2024-01-01" },
];

async function seed() {
  console.log("🌱 Seeding database...");
  
  // Clear existing data
  await supabase.from("absences").delete().neq("id", "");
  await supabase.from("enseignants").delete().neq("id", "");
  await supabase.from("users").delete().neq("id", "");
  await supabase.from("etablissements").delete().neq("id", "");
  
  // Insert data
  const { error: usersError } = await supabase.from("users").insert(defaultUsers);
  if (usersError) console.error("Users error:", usersError);
  else console.log("✅ Users seeded");
  
  const { error: etabError } = await supabase.from("etablissements").insert(defaultEtablissements);
  if (etabError) console.error("Etablissements error:", etabError);
  else console.log("✅ Etablissements seeded");
  
  const { error: ensError } = await supabase.from("enseignants").insert(defaultEnseignants);
  if (ensError) console.error("Enseignants error:", ensError);
  else console.log("✅ Enseignants seeded");
  
  const { error: absError } = await supabase.from("absences").insert(defaultAbsences);
  if (absError) console.error("Absences error:", absError);
  else console.log("✅ Absences seeded");
  
  console.log("🎉 Seeding complete!");
}

seed().catch(console.error);
