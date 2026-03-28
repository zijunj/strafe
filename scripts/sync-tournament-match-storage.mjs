const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

const eventIdsArg = process.argv[2];
const includeCompletedArg = process.argv[3];

const eventIds =
  eventIdsArg && eventIdsArg !== "all"
    ? eventIdsArg
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
    : undefined;

const includeCompletedEvents =
  includeCompletedArg === "true" || includeCompletedArg === "1";

async function main() {
  console.log(`Starting tournament/match storage sync against ${baseUrl}`);

  if (eventIds?.length) {
    console.log(`Targeting VLR event ids: ${eventIds.join(", ")}`);
  } else {
    console.log(
      `Targeting ${includeCompletedEvents ? "all" : "ongoing/upcoming"} events`
    );
  }

  const response = await fetch(`${baseUrl}/api/storage/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventIds,
      includeCompletedEvents,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Tournament/match storage sync failed.");
  }

  console.log("Sync complete:");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error("Sync script failed:", error.message);
  process.exit(1);
});
