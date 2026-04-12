import * as doctorService from "./doctorService.js";
import * as doctorEventPublisher from "./doctorEventPublisher.js";
import { createDoctorSyncPayload } from "./doctorSyncPayload.js";

const normalizeDoctorList = (result) => {
  if (Array.isArray(result?.data)) {
    return result.data;
  }
  if (Array.isArray(result)) {
    return result;
  }
  return [];
};

export const syncFullDoctorCatalog = async () => {
  const result = await doctorService.searchDoctors({});
  const doctors = normalizeDoctorList(result);

  if (doctors.length === 0) {
    console.warn("[videoCatalogSyncService] No doctors found to sync.");
    return { synced: 0, total: 0 };
  }

  const syncResults = await Promise.allSettled(
    doctors.map((doctor) => {
      const payload = createDoctorSyncPayload(doctor);
      if (!payload) {
        return Promise.resolve();
      }
      return doctorEventPublisher.publishDoctorUpdated(payload);
    })
  );

  const synced = syncResults.filter((r) => r.status === "fulfilled").length;
  const failed = syncResults.filter((r) => r.status === "rejected").length;

  console.log(`[videoCatalogSyncService] published ${synced}/${doctors.length} doctor.updated events, failed ${failed}`);

  return { synced, failed, total: doctors.length };
};