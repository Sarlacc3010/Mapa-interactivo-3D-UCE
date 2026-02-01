const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const generateLogsReport = async (req, res) => {
  try {
    // 1. Consulta SQL ajustada a Hora Ecuador (UTC-5)
    // Asumimos que la DB guarda en UTC. 'AT TIME ZONE' hace la magia.
    const result = await pool.query(`
      SELECT 
        action, 
        level, 
        user_email, 
        ip_address, 
        TO_CHAR(timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil', 'YYYY-MM-DD HH24:MI:SS') as time 
      FROM system_logs 
      ORDER BY timestamp DESC 
      LIMIT 100
    `);

    const logs = result.rows;

    // 2. Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // 3. Headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_uce_${Date.now()}.pdf`);

    doc.pipe(res);

    // --- ENCABEZADO INSTITUCIONAL ---
    const logoPath = path.join(__dirname, '../../assets/uce-logo.png');

    // Intentar cargar el logo si existe
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 60 })
           .moveDown();
    }

    // Títulos Centrados (Alineados con el logo)
    doc.font('Helvetica-Bold').fontSize(16)
       .text('UNIVERSIDAD CENTRAL DEL ECUADOR', { align: 'center' });
    
    doc.fontSize(12)
       .text('SISTEMA DE MAPA INTERACTIVO 3D', { align: 'center' });
    
    doc.fontSize(10).font('Helvetica')
       .text('Reporte Oficial de Actividad y Auditoría', { align: 'center' });

    doc.moveDown(1);
    
    // Línea divisoria decorativa
    doc.moveTo(50, 115)
       .lineTo(550, 115)
       .strokeColor('#1e3a8a') // Azul UCE
       .lineWidth(2)
       .stroke();

    // Información del Reporte
    doc.moveDown(1);
    doc.fontSize(9).fillColor('black');
    doc.text(`Generado por: ${req.user.email}`, 50, 130);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`, 50, 145, { align: 'left' });
    
    // --- TABLA DE DATOS ---
    const tableTop = 180;
    const colAction = 50;
    const colUser = 200;
    const colTime = 400;

    // Encabezados de Tabla
    doc.font('Helvetica-Bold').fontSize(10).fillColor('white');
    
    // Fondo del encabezado de tabla
    doc.rect(50, tableTop - 5, 500, 20).fill('#1e3a8a'); // Fondo Azul
    
    doc.fillColor('white');
    doc.text('ACCIÓN / DETALLE', colAction + 5, tableTop);
    doc.text('USUARIO', colUser, tableTop);
    doc.text('FECHA (EC)', colTime, tableTop);

    // Filas
    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('black');

    logs.forEach((log, index) => {
      // Nueva página si se acaba el espacio
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
        // Repetir encabezado en nueva página (opcional, aquí simple)
      }

      // Color de fondo alternado para filas (Zebra striping)
      if (index % 2 === 0) {
        doc.save();
        doc.rect(50, yPosition - 5, 500, 20).fill('#f3f4f6'); // Gris muy suave
        doc.restore();
      }

      doc.text(log.action, colAction + 5, yPosition, { width: 140, ellipsis: true });
      doc.text(log.user_email || 'Invitado', colUser, yPosition, { width: 190, ellipsis: true });
      doc.text(log.time, colTime, yPosition);
      
      yPosition += 20;
    });

    // Pie de página
    const pageHeight = doc.page.height;
    doc.fontSize(8).fillColor('gray');
    doc.text('Documento generado automáticamente por el sistema. Uso interno.', 50, pageHeight - 50, { align: 'center', width: 500 });

    doc.end();
    
    logger.info('REPORT_GENERATED_PDF', { user: req.user.email });

  } catch (err) {
    logger.error('REPORT_ERROR', { error: err.message });
    if (!res.headersSent) res.status(500).json({ error: "Error generando el reporte PDF" });
  }
};

module.exports = { generateLogsReport };