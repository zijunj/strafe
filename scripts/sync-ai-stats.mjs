
const regions = ["ap", "br", "cn", "col", "eu", "jp", "kr", "la", "la-n", "la-s", "mn", "na", "oce"];
const timespans = [30, 60, 90, "all"];
const eventGroupArg = process.argv[2];
const parsedEventGroupId =
  eventGroupArg && eventGroupArg !== "all" ? Number(eventGroupArg) : null;
const eventGroupId =
  parsedEventGroupId !== null && !Number.isNaN(parsedEventGroupId)
    ? parsedEventGroupId
    : null;

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

async function syncOne(region, timespanDays, eventGroupId) {
  const response = await fetch(`${baseUrl}/api/ai/sync-stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.AI_SYNC_SECRET
        ? { Authorization: `Bearer ${process.env.AI_SYNC_SECRET}` }
        : {}),
    },
    body: JSON.stringify({ region, timespanDays, eventGroupId }),
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
  console.log(
    `Starting AI stats sync against ${baseUrl} for event_group_id=${eventGroupId ?? "all"}`
  );

  const results = [];

  for (const region of regions) {
    for (const timespanDays of timespans) {
      console.log(`Syncing ${region} / ${timespanDays}d ...`);

      const result = await syncOne(region, timespanDays, eventGroupId);
      results.push({
        region,
        timespanDays,
        eventGroupId,
        insertedCount: result.insertedCount,
      });

      console.log(
        `Done ${region} / ${timespanDays}d / event_group_id=${eventGroupId ?? "all"} -> inserted ${result.insertedCount}`
      );
    }
  }

  console.log("\nSummary");
  for (const result of results) {
    console.log(
      `${result.region} / ${result.timespanDays}d / event_group_id=${result.eventGroupId ?? "all"} -> ${result.insertedCount}`
    );
  }
}

main().catch((error) => {
  console.error("Sync script failed:", error.message);
  process.exit(1);
});
