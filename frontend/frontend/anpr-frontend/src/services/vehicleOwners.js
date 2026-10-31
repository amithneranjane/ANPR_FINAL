import { getVehicle } from "./api";

export async function getVehicleOwner(plateNumber) {
  if (!plateNumber || plateNumber === "Not Recognized" || plateNumber === "Not Detected") {
    return null;
  }

  const clean = String(plateNumber).replace(/\s/g, "").toUpperCase();
  try {
    const data = await getVehicle(clean);
    return data;
  } catch {
    return null;
  }
}

export default { getVehicleOwner };