const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://crm_db_zco5_user:LHJIx3TjIqbvKOEvX88GAaqOZSUp1mMg@dpg-d81121btqb8s73ad47f0-a.virginia-postgres.render.com/crm_db_zco5',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    // Find the user
    const userRes = await client.query('SELECT id FROM "users" WHERE email = $1', ['ahmadhayotov2511@gmail.com']);
    if (userRes.rowCount === 0) {
      console.log('User not found');
      return;
    }
    const mentorId = userRes.rows[0].id;
    console.log('Mentor ID:', mentorId);

    // Create CourseMonth
    // e.g., "Май 2026"
    const startDate = '2026-05-05';
    const endDate = '2026-06-03';
    const name = 'Май 2026';

    let courseMonthId;
    const existingCm = await client.query('SELECT id FROM "course_month" WHERE name = $1 AND "mentorId" = $2', [name, mentorId]);
    if (existingCm.rowCount > 0) {
      courseMonthId = existingCm.rows[0].id;
      console.log('CourseMonth already exists:', courseMonthId);
    } else {
      const cmRes = await client.query(`
        INSERT INTO "course_month" (name, "startDate", "endDate", "mentorId", "createdAt")
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [name, startDate, endDate, mentorId]);
      courseMonthId = cmRes.rows[0].id;
      console.log('Created CourseMonth:', courseMonthId);
    }

    // Update groups
    const updateRes = await client.query(`
      UPDATE "groups"
      SET "courseMonthId" = $1
      WHERE "mentorId" = $2 AND "courseMonthId" IS NULL
    `, [courseMonthId, mentorId]);

    console.log(`Updated ${updateRes.rowCount} groups`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

migrate();
