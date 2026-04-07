import * as doctorService from "./doctorService.js";
import * as videoSyncClient from "./videoSyncClient.js";

export const syncFullDoctorCatalog = async () => {
  const result = await doctorService.searchDoctors({});
  const doctors = Array.isArray(result?.data) ? result.data : [];

  if (doctors.length === 0) {
    console.warn("[videoCatalogSyncService] No doctors found to sync.");
    return { synced: 0, total: 0 };
  }

  const syncResults = await Promise.allSettled(
    doctors.map((doctor) => videoSyncClient.syncDoctor(doctor))
  );

  const synced = syncResults.filter((r) => r.status === "fulfilled").length;
  const failed = syncResults.filter((r) => r.status === "rejected").length;

  console.log(`[videoCatalogSyncService] synced ${synced}/${doctors.length} doctors, failed ${failed}`);

  return { synced, failed, total: doctors.length };
};