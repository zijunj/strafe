
const regions = ["ap", "br", "cn", "col", "eu", "jp", "kr", "la", "la-n", "la-s", "mn", "na", "oce"];
const timespans = [30, 60, 90, "all"];

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

async function syncOne(region, timespanDays) {
  const response = await fetch(`${baseUrl}/api/ai/sync-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ region, timespanDays }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `[${region}/${timespanDays}] ${payload.error || "Sync failed"}`
    );
  }

  return payload;
}

async function main() {
  console.log(`Starting AI stats sync against ${baseUrl}`);

  const results = [];

  for (const region of regions) {
    for (const timespanDays of timespans) {
      console.log(`Syncing ${region} / ${timespanDays}d ...`);

      const result = await syncOne(region, timespanDays);
      results.push({
        region,
        timespanDays,
        insertedCount: result.insertedCount,
      });

      console.log(
        `Done ${region} / ${timespanDays}d -> inserted ${result.insertedCount}`
      );
    }
  }

  console.log("\nSummary");
  for (const result of results) {
    console.log(
      `${result.region} / ${result.timespanDays}d -> ${result.insertedCount}`
    );
  }
}

main().catch((error) => {
  console.error("Sync script failed:", error.message);
  process.exit(1);
});
