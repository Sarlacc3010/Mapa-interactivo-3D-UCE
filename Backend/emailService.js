const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configuración del transportador (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Lee de tu .env
    pass: process.env.EMAIL_PASS, // Lee de tu .env
  },
});

// 2. Función para enviar la notificación
const sendEventNotification = async (emails, eventTitle, eventDate) => {
  if (!emails || emails.length === 0) return;

  const mailOptions = {
    from: `"Campus Virtual UCE" <${process.env.EMAIL_USER}>`,
    to: emails, // Nodemailer es inteligente: acepta un array ['a@a.com', 'b@b.com']
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
            <h3 style="margin-top: 0;">${eventTitle}</h3>
            <p><strong>📅 Fecha:</strong> ${eventDate}</p>
            <p><strong>📍 Lugar:</strong> Campus Universitario</p>
          </div>

          <p>Ingresa al mapa interactivo para ver la ubicación exacta.</p>
          
          <a href="http://localhost:5173" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir al Mapa 3D</a>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          &copy; 2025 Campus Virtual UCE
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Notificación enviada exitosamente a ${emails.length} usuarios.`);
  } catch (error) {
    console.error("❌ Error enviando correos:", error);
  }
};

module.exports = { sendEventNotification };