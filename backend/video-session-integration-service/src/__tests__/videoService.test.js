process.env.DOCTOR_SERVICE_URL =
  process.env.DOCTOR_SERVICE_URL || "http://localhost:5002";

const assert = require("node:assert");
const { describe, it } = require("node:test");
const { generateNeuralLink } = require("../services/videoService");
describe("videoService.generateNeuralLink", () => {
  it("generates a Jitsi URL containing a sanitized roomId with appointment id", async () => {
    const session = await generateNeuralLink("PAT-1", "DOC-1", "appt/123#test");

    assert.ok(session.roomId.startsWith("nexus-appointment-"));
    assert.ok(session.roomUrl.startsWith("https://meet.jit.si/"));
    assert.ok(session.roomId.includes("appt123test"));
    assert.equal(session.patientId, "PAT-1");
    assert.equal(session.doctorId, "DOC-1");
  });
  it("generates a random roomId when appointmentId is not supplied", async () => {
    const session = await generateNeuralLink("PAT-2", "DOC-2");

    assert.ok(session.roomId.startsWith("nexus-link-"));
    assert.ok(session.roomUrl.startsWith("https://meet.jit.si/"));
    assert.equal(session.patientId, "PAT-2");
    assert.equal(session.doctorId, "DOC-2");
  });
});
