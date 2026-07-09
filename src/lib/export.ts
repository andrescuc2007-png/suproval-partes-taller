"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ParteTaller } from "./types";
import { formatFecha } from "./partes-utils";

const CABECERAS = [
  "Fecha",
  "Serie",
  "Cliente",
  "Teléfono",
  "ID Máquina",
  "Tipo Máquina",
  "Estado",
  "Delegación",
  "Descripción",
  "Material utilizado",
  "Tiempo trabajo",
];

function filaDesdeParte(p: ParteTaller): (string | number)[] {
  return [
    formatFecha(p.fecha),
    p.serie ?? "",
    p.cliente ?? "",
    p.telefono ?? "",
    p.id_maquina ?? "",
    p.tipo_maquina ?? "",
    p.estado_reparacion ?? "",
    p.delegacion ?? "",
    p.descripcion ?? "",
    p.material_utilizado ?? "",
    p.tiempo_trabajo ?? "",
  ];
}

function nombreArchivo(ext: string): string {
  const hoy = new Date().toISOString().split("T")[0];
  return `suproval_partes_${hoy}.${ext}`;
}

// ------------------------------------------------------------
// Exportar a Excel (.xlsx)
// ------------------------------------------------------------
export function exportarExcel(partes: ParteTaller[]): void {
  const datos = [CABECERAS, ...partes.map(filaDesdeParte)];
  const ws = XLSX.utils.aoa_to_sheet(datos);

  // Anchos de columna aproximados
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 12 }, // Serie
    { wch: 24 }, // Cliente
    { wch: 14 }, // Teléfono
    { wch: 14 }, // ID Máquina
    { wch: 18 }, // Tipo
    { wch: 22 }, // Estado
    { wch: 16 }, // Delegación
    { wch: 40 }, // Descripción
    { wch: 30 }, // Material
    { wch: 12 }, // Tiempo
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Partes");
  XLSX.writeFile(wb, nombreArchivo("xlsx"));
}

// ------------------------------------------------------------
// Exportar a PDF con formato limpio
// ------------------------------------------------------------
export function exportarPDF(partes: ParteTaller[]): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const navy = "#0D1B4B";
  const gold = "#F5C800";

  // Cabecera corporativa
  doc.setFillColor(navy);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, "F");

  doc.setTextColor(gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SUPROVAL", 40, 26);

  doc.setTextColor("#FFFFFF");
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Partes de Taller", 40, 44);

  const fechaExport = new Date().toLocaleString("es-ES");
  doc.setFontSize(9);
  doc.text(
    `Exportado: ${fechaExport}`,
    doc.internal.pageSize.getWidth() - 40,
    26,
    { align: "right" }
  );
  doc.text(
    `Total de partes: ${partes.length}`,
    doc.internal.pageSize.getWidth() - 40,
    44,
    { align: "right" }
  );

  autoTable(doc, {
    startY: 72,
    head: [CABECERAS],
    body: partes.map(filaDesdeParte),
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: {
      fillColor: [13, 27, 75], // navy
      textColor: [245, 200, 0], // gold
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [242, 244, 250] },
    columnStyles: {
      8: { cellWidth: 140 }, // Descripción
      9: { cellWidth: 110 }, // Material
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor("#666666");
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 16,
        { align: "right" }
      );
    },
  });

  doc.save(nombreArchivo("pdf"));
}
