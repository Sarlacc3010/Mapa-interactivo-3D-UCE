const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// 🌐 Traducciones de acciones a español
const ACTION_LABELS = {
  // Autenticación
  'LOGIN_SUCCESS': 'Inicio de sesión exitoso',
  'LOGIN_GOOGLE': 'Inicio de sesión con Google',
  'LOGIN_BLOCKED': 'Inicio de sesión bloqueado',
  'LOGOUT': 'Cierre de sesión',

  // Registro
  'REGISTER_ATTEMPT': 'Intento de registro',
  'ACCOUNT_VERIFIED': 'Cuenta verificada',
  'EMAIL_SENT': 'Correo enviado',

  // Eventos
  'EVENT_CREATED': 'Evento creado',
  'EVENT_UPDATED': 'Evento actualizado',
  'EVENT_DELETED': 'Evento eliminado',

  // Ubicaciones
  'LOCATION_CREATED': 'Ubicación creada',
  'LOCATION_UPDATED': 'Ubicación actualizada',
  'LOCATION_DELETED': 'Ubicación eliminada',

  // Analíticas
  'FACULTY_VISIT': 'Visita a facultad',

  // Reportes
  'REPORT_GENERATED': 'Reporte generado',
  'REPORT_GENERATED_PDF': 'Reporte PDF generado',

  // Acceso
  'GUEST_ACCESS': 'Acceso como invitado',
  'SERVER_START': 'Servidor iniciado'
};

const generateLogsReport = async (req, res) => {
  try {
    // 1️⃣ Consultar logs de sistema (últimas 24 horas)
    const logsResult = await pool.query(`
      SELECT 
        sl.action,
        sl.level,
        sl.user_email,
        sl.ip_address,
        sl.details,
        u.name as user_name,
        u.role as user_role,
        TO_CHAR(sl.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil', 
                'YYYY-MM-DD HH24:MI:SS') as time,
        sl.timestamp
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_email = u.email
      WHERE sl.timestamp >= NOW() - INTERVAL '24 hours'
        AND sl.action NOT IN ('SOCKET_CONNECT', 'SOCKET_DISCONNECT')
      ORDER BY sl.timestamp DESC
    `);

    // 2️⃣ Consultar visitas a facultades (últimas 24 horas)
    const visitsResult = await pool.query(`
      SELECT 
        u.id as user_id,
        v.visitor_email as user_email,
        u.name as user_name,
        u.role as user_role,
        l.name as location_name,
        TO_CHAR(v.visit_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil', 
                'YYYY-MM-DD HH24:MI:SS') as time,
        v.visit_date as timestamp
      FROM visits v
      LEFT JOIN users u ON v.visitor_email = u.email
      JOIN locations l ON v.location_id = l.id
      WHERE v.visit_date >= NOW() - INTERVAL '24 hours'
      ORDER BY v.visit_date DESC
    `);

    // 3️⃣ Combinar logs y visitas
    const allLogs = [
      ...logsResult.rows.map(log => ({
        action: log.action,
        user_email: log.user_email,
        user_name: log.user_name || 'Usuario',
        user_role: log.user_role || 'Invitado',
        details: log.details || (log.ip_address ? `IP: ${log.ip_address}` : ''),
        time: log.time,
        timestamp: log.timestamp
      })),
      ...visitsResult.rows.map(visit => ({
        action: 'FACULTY_VISIT',
        user_email: visit.user_email,
        user_name: visit.user_name,
        user_role: visit.user_role,
        details: visit.location_name,
        time: visit.time,
        timestamp: visit.timestamp
      }))
    ];

    // Ordenar por timestamp descendente
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 4️⃣ Calcular estadísticas
    const stats = {
      total: allLogs.length,
      uniqueUsers: new Set(allLogs.map(l => l.user_email).filter(Boolean)).size,
      byAction: {}
    };

    allLogs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    // 5️⃣ Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_uce_24h_${Date.now()}.pdf`);

    doc.pipe(res);

    // 📄 ENCABEZADO
    const logoPath = path.join(__dirname, '../../assets/uce-logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 60 });
    }

    doc.font('Helvetica-Bold').fontSize(16)
      .text('UNIVERSIDAD CENTRAL DEL ECUADOR', { align: 'center' });

    doc.fontSize(12)
      .text('SISTEMA DE MAPA INTERACTIVO 3D', { align: 'center' });

    doc.fontSize(10).font('Helvetica')
      .text('Reporte de Actividad del Sistema - Últimas 24 Horas', { align: 'center' });

    doc.moveDown(1);

    // Línea divisoria
    doc.moveTo(50, 115).lineTo(550, 115)
      .strokeColor('#1e3a8a').lineWidth(2).stroke();

    // 📊 INFORMACIÓN DEL REPORTE
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('black');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const formatDate = (date) => date.toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(`Período: Últimas 24 horas`, 50, 130);
    doc.text(`Desde: ${formatDate(yesterday)}`, 50, 145);
    doc.text(`Hasta: ${formatDate(now)}`, 50, 160);
    doc.text(`Generado por: ${req.user.email}`, 350, 130);
    doc.text(`Fecha de emisión: ${formatDate(now)}`, 350, 145);

    // 📈 RESUMEN ESTADÍSTICO
    doc.moveDown(2);
    const summaryTop = 195;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('white');
    doc.rect(50, summaryTop, 500, 20).fill('#1e3a8a');
    doc.text('RESUMEN EJECUTIVO', 55, summaryTop + 5);

    doc.font('Helvetica').fontSize(9).fillColor('black');
    let summaryY = summaryTop + 30;

    doc.text(`Total de acciones registradas: ${stats.total}`, 55, summaryY);
    doc.text(`Usuarios activos: ${stats.uniqueUsers}`, 300, summaryY);
    summaryY += 15;

    // Top 5 acciones
    const topActions = Object.entries(stats.byAction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    topActions.forEach(([action, count]) => {
      const label = ACTION_LABELS[action] || action;
      doc.text(`• ${label}: ${count}`, 55, summaryY);
      summaryY += 12;
    });

    // 📋 TABLA DE LOGS DETALLADOS
    const tableTop = summaryY + 20;
    const colAction = 50;
    const colUser = 180;
    const colDetails = 310;
    const colTime = 450;

    // Encabezado de tabla
    doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
    doc.rect(50, tableTop - 5, 500, 20).fill('#1e3a8a');

    doc.text('ACCIÓN', colAction + 5, tableTop);
    doc.text('USUARIO', colUser + 5, tableTop);
    doc.text('DETALLES', colDetails + 5, tableTop);
    doc.text('FECHA/HORA', colTime + 5, tableTop);

    // Filas de datos
    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(8).fillColor('black');

    allLogs.forEach((log, index) => {
      // Nueva página si es necesario
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;

        // Repetir encabezado
        doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
        doc.rect(50, yPosition - 5, 500, 20).fill('#1e3a8a');
        doc.text('ACCIÓN', colAction + 5, yPosition);
        doc.text('USUARIO', colUser + 5, yPosition);
        doc.text('DETALLES', colDetails + 5, yPosition);
        doc.text('FECHA/HORA', colTime + 5, yPosition);
        yPosition += 25;
        doc.font('Helvetica').fontSize(8).fillColor('black');
      }

      // Fondo alternado
      if (index % 2 === 0) {
        doc.save();
        doc.rect(50, yPosition - 5, 500, 18).fill('#f3f4f6');
        doc.restore();
      }

      // Acción traducida
      const actionLabel = ACTION_LABELS[log.action] || log.action;
      doc.text(actionLabel, colAction + 5, yPosition, { width: 120, ellipsis: true });

      // Usuario (nombre + rol)
      const userInfo = `${log.user_name}\n(${log.user_role})`;
      doc.text(userInfo, colUser + 5, yPosition, { width: 120, ellipsis: true });

      // Detalles
      doc.text(log.details || '-', colDetails + 5, yPosition, { width: 130, ellipsis: true });

      // Fecha/Hora
      doc.text(log.time, colTime + 5, yPosition);

      yPosition += 18;
    });

    // 📌 PIE DE PÁGINA
    const pageHeight = doc.page.height;
    doc.fontSize(7).fillColor('gray');
    doc.text(
      'Documento generado automáticamente por el Sistema de Mapa Interactivo 3D UCE. Uso interno.',
      50,
      pageHeight - 50,
      { align: 'center', width: 500 }
    );

    doc.end();

    logger.info('REPORT_GENERATED_PDF', {
      user: req.user.email,
      totalLogs: allLogs.length,
      period: '24h'
    });

  } catch (err) {
    logger.error('REPORT_ERROR', { error: err.message, stack: err.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: "Error generando el reporte PDF" });
    }
  }
};

module.exports = { generateLogsReport };