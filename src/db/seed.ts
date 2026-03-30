import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { createUser, findUserByEmail } from "@/db/queries/auth";
import { createProjectRecord } from "@/db/queries/projects";
import { hashPassword, normalizeEmail } from "@/lib/auth/password";

const demoEmail = normalizeEmail("demo@bedrockbuild.com");

const existingUser = await findUserByEmail(db, demoEmail);

let demoUser = existingUser;

if (!demoUser) {
  demoUser = await createUser(db, {
    id: randomUUID(),
    email: demoEmail,
    passwordHash: await hashPassword("password123"),
    fullName: "Demo Superintendent",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

if (!demoUser) {
  throw new Error("Unable to seed demo user.");
}

const existingProjects = await db.query.projects.findMany({
  where: (projects, { eq }) => eq(projects.userId, demoUser.id),
});

if (existingProjects.length === 0) {
  await createProjectRecord(db, {
    id: randomUUID(),
    userId: demoUser.id,
    name: "Riverside Warehouse Slab",
    address: "1450 River Bend Rd, Albany, NY",
    dateStarted: "2026-03-14",
    estimatedCompletionDate: "2026-05-01",
    totalConcretePoured: 180,
    estimatedTotalConcrete: 640,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await createProjectRecord(db, {
    id: randomUUID(),
    userId: demoUser.id,
    name: "West Gate Footings",
    address: "77 Industrial Park Dr, Syracuse, NY",
    dateStarted: "2026-03-20",
    estimatedCompletionDate: "2026-04-18",
    totalConcretePoured: 92.5,
    estimatedTotalConcrete: 310,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await createProjectRecord(db, {
    id: randomUUID(),
    userId: demoUser.id,
    name: "North Tower Parking Deck",
    address: "12 Granite Ave, Rochester, NY",
    dateStarted: "2026-03-27",
    estimatedCompletionDate: "2026-06-15",
    totalConcretePoured: 48,
    estimatedTotalConcrete: 520,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

console.log("Seed completed.");
