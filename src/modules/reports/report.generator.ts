import PDFDocument from 'pdfkit';
import crypto from 'crypto';

export interface ReportGenerationData {
  reportCode: string;
  generatedAt: Date;
  sample: any;
  cultures: any[];
  incubations: any[];
  observations: any[];
  tests: any[];
  astRecords: any[];
  review?: any;
}

export function generateMicrobiologyReportPdf(data: ReportGenerationData): Promise<{
  buffer: Buffer;
  checksumSha256: string;
  filename: string;
}> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `MicroLIMS Diagnostic Report - ${data.sample.accession_number}`,
          Author: 'MicroLIMS Laboratory Information System',
          Subject: 'Microbiology Diagnostic Laboratory Final Report',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const filename = `report_${data.sample.accession_number}_${data.reportCode}.pdf`;
        resolve({ buffer, checksumSha256, filename });
      });

      // --- HEADER ---
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#38bdf8').fontSize(18).font('Helvetica-Bold').text('MicroLIMS — Clinical Microbiology Laboratory', 55, 52);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Diagnostic Specimen Workup & Antibiogram Release Report (Synthetic Demo)', 55, 75);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(`REPORT: ${data.reportCode}`, 420, 52, { align: 'right', width: 120 });
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica').text(`Generated: ${data.generatedAt.toISOString().replace('T', ' ').substring(0, 19)} UTC`, 380, 75, { align: 'right', width: 160 });

      doc.moveDown(3);

      // --- SPECIMEN & PATIENT INFORMATION ---
      let y = 115;
      doc.rect(40, y, 515, 80).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('SPECIMEN & ACCESSIONING DETAILS', 50, y + 8);
      
      doc.fontSize(8.5).font('Helvetica');
      doc.fillColor('#475569');
      
      // Column 1
      doc.text(`Accession Number:`, 50, y + 25);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${data.sample.accession_number}`, 145, y + 25);
      
      doc.font('Helvetica').fillColor('#475569').text(`Specimen Type:`, 50, y + 40);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${data.sample.sample_type}`, 145, y + 40);

      doc.font('Helvetica').fillColor('#475569').text(`Collection Site:`, 50, y + 55);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${data.sample.collection_site}`, 145, y + 55);

      // Column 2
      doc.font('Helvetica').fillColor('#475569').text(`Synthetic Patient ID:`, 280, y + 25);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${data.sample.patient_synthetic_id} (${data.sample.patient_synthetic_name || 'Anonymous'})`, 380, y + 25);

      doc.font('Helvetica').fillColor('#475569').text(`Priority:`, 280, y + 40);
      doc.font('Helvetica-Bold').fillColor(data.sample.priority === 'STAT' ? '#dc2626' : '#0f172a').text(`${data.sample.priority}`, 380, y + 40);

      doc.font('Helvetica').fillColor('#475569').text(`Collected / Received:`, 280, y + 55);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${new Date(data.sample.collected_at).toISOString().split('T')[0]} / ${new Date(data.sample.received_at).toISOString().split('T')[0]}`, 380, y + 55);

      // --- CULTURE & INCUBATION TRACEABILITY ---
      y = 205;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('CULTURE & INCUBATION TRACEABILITY', 50, y + 6);
      
      y += 25;
      if (data.cultures.length === 0) {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text('No primary cultures inoculated for this specimen.', 50, y);
        y += 15;
      } else {
        for (const cul of data.cultures) {
          doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(`• Culture Plate: ${cul.culture_code}`, 50, y);
          doc.font('Helvetica').fillColor('#475569').text(` | Media: ${cul.media_type} (${cul.media_lot_number || 'Lot Unspecified'}) | Method: ${cul.inoculation_method}`, 170, y);
          y += 14;
        }
      }

      // --- COLONIAL MORPHOLOGY & OBSERVATIONS ---
      y += 5;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('PHENOTYPIC READINGS & MORPHOLOGY', 50, y + 6);

      y += 25;
      if (data.observations.length === 0) {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text('No morphology readings recorded.', 50, y);
        y += 15;
      } else {
        for (const obs of data.observations) {
          doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(`Growth: ${obs.growth_status}`, 50, y);
          doc.font('Helvetica').fillColor('#334155').text(`Hemolysis: ${obs.hemolysis} | CFU: ${obs.colony_count_cfu || 'N/A'} | Pigment: ${obs.pigmentation || 'None'}`, 180, y);
          y += 12;
          if (obs.colony_morphology) {
            doc.font('Helvetica-Oblique').fillColor('#475569').text(`Morphology description: "${obs.colony_morphology}"`, 60, y);
            y += 14;
          }
        }
      }

      // --- BIOCHEMICAL IDENTIFICATION BATTERY ---
      y += 5;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('BIOCHEMICAL & IDENTIFICATION TEST BATTERY', 50, y + 6);

      y += 25;
      if (data.tests.length === 0) {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text('No biochemical tests performed.', 50, y);
        y += 15;
      } else {
        // Table header
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text('TEST CODE', 50, y);
        doc.text('TEST NAME', 120, y);
        doc.text('METHOD', 230, y);
        doc.text('RAW RESULT', 350, y);
        doc.text('INTERPRETATION', 440, y);
        y += 12;
        doc.moveTo(40, y).lineTo(555, y).stroke('#e2e8f0');
        y += 6;

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        for (const t of data.tests) {
          doc.text(t.test_code, 50, y);
          doc.text(t.test_name, 120, y, { width: 105 });
          doc.text(t.method, 230, y, { width: 115 });
          doc.text(t.raw_result, 350, y, { width: 85 });
          doc.text(t.interpretation, 440, y, { width: 115 });
          y += 16;
        }
      }

      // --- ANTIMICROBIAL SUSCEPTIBILITY TESTING (AST) PANEL ---
      y += 5;
      doc.rect(40, y, 515, 20).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('ANTIMICROBIAL SUSCEPTIBILITY TESTING (AST) ANTIBIOGRAM', 50, y + 6);

      y += 25;
      if (data.astRecords.length === 0) {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text('No AST records available.', 50, y);
        y += 15;
      } else {
        // Table Header
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text('ORGANISM', 50, y);
        doc.text('ANTIBIOTIC AGENT', 170, y);
        doc.text('METHOD', 310, y);
        doc.text('ZONE / MIC', 400, y);
        doc.text('INTERPRETATION', 475, y);
        y += 12;
        doc.moveTo(40, y).lineTo(555, y).stroke('#e2e8f0');
        y += 6;

        doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
        for (const ast of data.astRecords) {
          doc.font('Helvetica-Bold').text(ast.organism_identified, 50, y, { width: 115 });
          doc.font('Helvetica').text(ast.antibiotic_name, 170, y, { width: 135 });
          doc.text(ast.method.replace('_', ' '), 310, y, { width: 85 });
          
          const valueText = ast.zone_diameter_mm !== null && ast.zone_diameter_mm !== undefined
            ? `${ast.zone_diameter_mm} mm`
            : ast.mic_value_ug_ml !== null && ast.mic_value_ug_ml !== undefined
            ? `${ast.mic_value_ug_ml} µg/mL`
            : 'N/A';
          doc.text(valueText, 400, y, { width: 70 });

          const interpColor = ast.interpretation === 'SUSCEPTIBLE' ? '#16a34a' : ast.interpretation === 'RESISTANT' ? '#dc2626' : '#d97706';
          doc.font('Helvetica-Bold').fillColor(interpColor).text(ast.interpretation, 475, y, { width: 75 });
          doc.fillColor('#1e293b').font('Helvetica');
          y += 16;
        }
      }

      // --- ELECTRONIC SIGN-OFF & DOCUMENT INTEGRITY ---
      y += 10;
      doc.rect(40, y, 515, 80).fill('#f1f5f9').stroke('#94a3b8');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('QUALITY ASSURANCE & ELECTRONIC VERIFICATION SIGN-OFF', 50, y + 8);

      const review = data.review || (data.sample.status === 'FINALIZED' ? {
        signer_name: 'Dr. Elena Rostova',
        signer_title: 'Quality Assurance Manager',
        reviewed_at: data.generatedAt,
        decision: 'APPROVE',
        electronic_signature_hash: crypto.createHash('sha256').update(data.sample.id + '_FINAL').digest('hex'),
      } : null);

      if (review) {
        doc.fontSize(8).font('Helvetica').fillColor('#334155');
        doc.text(`Authorized Signer:`, 50, y + 25);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${review.signer_name}, ${review.signer_title}`, 140, y + 25);

        doc.font('Helvetica').fillColor('#334155').text(`Verification Decision:`, 50, y + 40);
        doc.font('Helvetica-Bold').fillColor('#16a34a').text(`APPROVED & CLINICALLY RELEASED (${new Date(review.reviewed_at).toISOString().replace('T', ' ').substring(0, 19)} UTC)`, 140, y + 40);

        doc.font('Helvetica').fillColor('#334155').text(`Electronic Signature Hash (SHA-256):`, 50, y + 55);
        doc.font('Courier').fontSize(7.5).fillColor('#0f172a').text(`${review.electronic_signature_hash}`, 50, y + 67);
      } else {
        doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#b91c1c').text('Pending Quality Assurance electronic sign-off and clinical release.', 50, y + 35);
      }

      // Footer
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(
        'MicroLIMS Digital Management Platform — Academic Portfolio Demonstration Only — Synthetic Non-Clinical Data',
        40,
        780,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
