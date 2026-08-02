import { runDailyInternshipRefresh } from "../lib/discovery/runInternshipSearch";

async function main() {
  const timestamp = new Date().toISOString();
  try {
    const result = await runDailyInternshipRefresh();
    console.log(
      `[${timestamp}] Daily internship refresh: added ${result.added.length} posting(s). ${result.note}`
    );
  } catch (err) {
    console.error(
      `[${timestamp}] Daily internship refresh failed:`,
      err instanceof Error ? err.message : err
    );
    process.exitCode = 1;
  }
}

main();
