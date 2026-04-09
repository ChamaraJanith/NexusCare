import amqp from 'amqplib';
import Doctor from '../models/Doctor.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE = 'doctor.registered';

export const startRabbitMQConsumer = async () => {
  let connection;
  let channel;

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    connection.on('error', (error) => {
      console.error('🚨 RabbitMQ connection error:', error);
    });
    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed');
    });

    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });

    console.log(`📥 Doctor Service RabbitMQ consumer connected, listening for ${QUEUE}`);

    channel.consume(
      QUEUE,
      async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString());
          console.log('📬 Received doctor.registered event:', payload);

          // Save doctor record to doctor-service MongoDB
          const doctorRecord = await Doctor.findOneAndUpdate(
            { doctorId: payload.doctorId },
            {
              doctorId: payload.doctorId,
              name: payload.name,
              email: payload.email,
              userId: payload.userId,
              phone: payload.phone || null,
              specialty: payload.specialty,
              subSpecialty: payload.subSpecialty || null,
              registrationNumber: payload.registrationNumber,
              hospital: payload.hospital || null,
              bio: payload.bio || null,
              consultationFee: payload.consultationFee || 0,
              experience: payload.experience || null,
              qualifications: payload.qualifications || [],
              verificationDocuments: payload.verificationDocuments || [],
              isVerified: false,
              createdAt: new Date(),
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
          );

          console.log(`✅ Doctor profile saved in doctor-service DB:`, doctorRecord.doctorId);
          console.log(`   name: ${doctorRecord.name}, email: ${doctorRecord.email}`);

          channel.ack(msg);
        } catch (error) {
          console.error('❌ Failed to process doctor.registered event', error);
          const redelivered = msg.fields.redelivered;
          channel.nack(msg, false, !redelivered);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error('❌ RabbitMQ consumer failed to start:', error);
  }
};
