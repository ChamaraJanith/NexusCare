import axios from "axios";
import AvailabilitySlot from "../models/AvailabilitySlot.js";

const FEE_SERVICE_URL = process.env.FEE_SERVICE_URL || "http://fee-management-service:5007";

const fetchHospitalFee = async (hospitalId, hospitalName) => {
  try {
    const { data } = await axios.get(`${FEE_SERVICE_URL}/api/hospitals/fee`, {
      params: { hospitalId, hospitalName },
      timeout: 5000
    });
    console.log(`  [fee-lookup] hospital="${hospitalName}" id="${hospitalId}" → fee=${data?.hospitalFee}`);
    return data?.hospitalFee ?? 0;
  } catch (err) {
    console.warn(`  [fee-lookup] FAILED for "${hospitalName}":`, err.message);
    return null;
  }
};

const fetchServiceFee = async () => {
  try {
    const { data } = await axios.get(`${FEE_SERVICE_URL}/api/service-fee`, { timeout: 5000 });
    const amount = data?.data?.amount ?? 0;
    console.log(`  [service-fee-lookup] global service fee → ${amount}`);
    return amount;
  } catch (err) {
    console.warn(`  [service-fee-lookup] FAILED:`, err.message);
    return null;
  }
};

export const migrateHospitalFees = async () => {
  try {
    // ── 1. Backfill serviceFee on ALL slots (global fee, same for every slot) ──
    const serviceFee = await fetchServiceFee();
    if (serviceFee === null) {
      console.warn("⚠️ Service fee migration skipped — fee-service unreachable, will retry on next startup");
    } else {
      const sfResult = await AvailabilitySlot.updateMany(
        { isDeleted: false, $or: [{ serviceFee: { $exists: false } }, { serviceFee: { $ne: serviceFee } }] },
        { $set: { serviceFee } }
      );
      console.log(`✅ Service fee migration: ${sfResult.modifiedCount} slot(s) updated to serviceFee=${serviceFee}`);
    }

    // ── 2. Backfill hospitalFee on PHYSICAL slots ──
    const slots = await AvailabilitySlot.find({
      slotType: "PHYSICAL",
      isDeleted: false
    }).select("_id hospitalId hospital hospitalFee");

    if (slots.length === 0) {
      console.log("✅ Hospital fee migration: no physical slots found");
      return;
    }

    console.log(`🔄 Hospital fee migration: processing ${slots.length} physical slot(s)...`);

    let updated = 0;
    for (const slot of slots) {
      const fee = await fetchHospitalFee(slot.hospitalId || "", slot.hospital || "");

      if (fee === null) {
        console.warn(`⚠️ Fee service unreachable for slot ${slot._id} — skipping, will retry on next startup`);
        continue;
      }

      // Only update if fee differs from what's stored
      if (fee !== slot.hospitalFee) {
        await AvailabilitySlot.updateOne(
          { _id: slot._id },
          { $set: { hospitalFee: fee } }
        );
        console.log(`  ✓ Updated slot ${slot._id} (${slot.hospital}): ${slot.hospitalFee} → ${fee}`);
        updated++;
      } else {
        console.log(`  - Slot ${slot._id} (${slot.hospital}): hospitalFee=${fee} already correct`);
      }
    }

    console.log(`✅ Hospital fee migration complete: ${updated} slot(s) updated`);
  } catch (err) {
    console.warn("⚠️ Hospital fee migration failed (non-critical):", err.message);
  }
};
