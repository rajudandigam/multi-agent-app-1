import { inspectRun, step } from "agent-inspect";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchHotels(city) {
  await delay(100);
  return [`${city} Grand Hotel`, `${city} Central Inn`];
}

async function checkAvailability(hotel) {
  await delay(80);
  return {
    hotel,
    rooms: 2,
  };
}

async function finalizeBooking(availability) {
  await delay(50);
  return `confirmed:${availability.hotel}`;
}

const result = await inspectRun("hotel-booking-local-test", async () => {
  const hotels = await step("search-hotels", () => searchHotels("Tokyo"));

  const availability = await step("check-availability", () =>
    checkAvailability(hotels[0]),
  );

  return step("finalize-booking", () => finalizeBooking(availability));
});

console.log("\nResult:", result);