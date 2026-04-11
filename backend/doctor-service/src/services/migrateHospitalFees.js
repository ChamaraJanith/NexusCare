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

export const migrateHospitalFees = async () => {
  try {
    // Re-migrate ALL physical slots every startup to fix any wrong values
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
        console.warn("⚠️ Fee service unreachable — will retry on next startup");
        break;
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
