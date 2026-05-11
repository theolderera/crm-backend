import { createConnection, DataSource } from "typeorm";
import { User } from "./users/user.entity";
import { Group } from "./groups/group.entity";
import { Student } from "./students/student.entity";
import { Attendance } from "./attendance/attendance.entity";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function migrate() {
  console.log("--- Оғози кӯчонидани маълумот ---");

  // 1. Пайвастшавӣ ба SQLite (Local)
  const sqliteSource = new DataSource({
    type: "better-sqlite3",
    database: "crm.sqlite",
    entities: [User, Group, Student, Attendance],
  });

  // 2. Пайвастшавӣ ба PostgreSQL (Render)
  const pgSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [User, Group, Student, Attendance],
    ssl: { rejectUnauthorized: false },
    synchronize: true, // Ин ҷадвалҳоро дар Postgres месозад
  });

  try {
    await sqliteSource.initialize();
    console.log("✅ Пайвастшавӣ ба SQLite бомуваффақият");

    await pgSource.initialize();
    console.log("✅ Пайвастшавӣ ба PostgreSQL бомуваффақият");

    // Кӯчонидани Корбарон (Users)
    const users = await sqliteSource.getRepository(User).find();
    console.log(`Интиқоли ${users.length} корбар...`);
    await pgSource.getRepository(User).save(users);

    // Кӯчонидани Гурӯҳҳо (Groups)
    const groups = await sqliteSource.getRepository(Group).find();
    console.log(`Интиқоли ${groups.length} гурӯҳ...`);
    await pgSource.getRepository(Group).save(groups);

    // Кӯчонидани Донишҷӯён (Students)
    const students = await sqliteSource.getRepository(Student).find();
    console.log(`Интиқоли ${students.length} донишҷӯ...`);
    await pgSource.getRepository(Student).save(students);

    // Кӯчонидани Давомот (Attendance)
    const attendance = await sqliteSource.getRepository(Attendance).find();
    console.log(`Интиқоли ${attendance.length} сабти давомот...`);
    await pgSource.getRepository(Attendance).save(attendance);

    console.log("--- ✅ МАЪЛУМОТ БОМУВАФФАҚИЯТ КӮЧОНИДА ШУД ---");
  } catch (error) {
    console.error("❌ Хатогӣ ҳангоми интиқол:", error);
  } finally {
    await sqliteSource.destroy();
    await pgSource.destroy();
  }
}

migrate();
