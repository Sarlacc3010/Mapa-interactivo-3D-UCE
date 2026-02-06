const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- 1. EVENT NOTIFICATION ---
const sendEventNotification = async (emails, eventTitle, eventDate, eventDescription, eventLocation) => {
  if (!emails || emails.length === 0) return;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const mailOptions = {
    from: `"Campus Virtual UCE" <${process.env.EMAIL_USER}>`,
    to: emails,
    subject: `📢 Nuevo Evento UCE: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #D9232D; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Universidad Central del Ecuador</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #1e3a8a;">¡Nuevo Evento Académico!</h2>
          <p>Hola,</p>
          <p>Se ha programado un nuevo evento que podría interesarte:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #D9232D; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${eventTitle}</h3>
            
            <p><strong>📅 Fecha:</strong> ${eventDate}</p>
            <p><strong>📍 Lugar:</strong> ${eventLocation}</p>
            
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
            <p style="color: #555; font-style: italic;">"${eventDescription}"</p>
          </div>

          <p>Ingresa al mapa interactivo para ver la ubicación exacta.</p>
          
          <a href="${frontendUrl}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir al Mapa 3D</a>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          &copy; 2026 Campus Virtual UCE
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Event notification sent to ${emails.length} users.`);
  } catch (error) {
    console.error("Error sending event notification:", error);
  }
};

// --- 2. EMAIL VERIFICATION ---
const sendVerificationEmail = async (email, token) => {
  // Adjust URL if frontend is on a different port/domain in production
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Seguridad UCE" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta - Mapa Interactivo UCE',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">Verificación de Cuenta</h2>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 16px; color: #333;">Hola,</p>
          <p style="color: #555;">Gracias por registrarte en el Mapa Interactivo de la UCE.</p>
          <p style="color: #555;">Para acceder a la plataforma y confirmar que este es tu correo real, por favor haz clic en el siguiente botón:</p>
          
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #D9232D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verificar mi Correo</a>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">O copia y pega este enlace en tu navegador:</p>
          <p style="font-size: 12px; color: #1e3a8a; word-break: break-all;">${verificationUrl}</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          &copy; 2026 Campus Virtual UCE
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending verification:", error);
  }
};

// EXPORT BOTH FUNCTIONS
module.exports = { sendEventNotification, sendVerificationEmail };