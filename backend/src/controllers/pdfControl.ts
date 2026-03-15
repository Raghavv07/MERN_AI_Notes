import { Response } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { AuthRequest } from '../middleware/authMiddle.ts';
import Notes from '../models/notesModel.ts';

interface PdfDownloadParams {
  noteId: string;
}

export const pdfDownload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as unknown as PdfDownloadParams;

    if (!noteId) {
      res.status(400).json({ message: 'Note ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    // Find the note and verify ownership
    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${note.topic.replace(/[^a-zA-Z0-9]/g, '_')}_notes.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text(note.topic, { align: 'center' });

    doc.moveDown(0.5);

    // Add metadata
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });

    if (note.classLevel) {
      doc.text(`Class: ${note.classLevel}`, { align: 'center' });
    }
    if (note.examType) {
      doc.text(`Exam Type: ${note.examType}`, { align: 'center' });
    }

    doc.moveDown(1.5);
    doc.fillColor('#000000');

    // Add horizontal line
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.moveDown(1);

    // Add content
    const content = note.notes;
    const lines = content.split('\n');

    for (const line of lines) {
      // Handle headings (lines starting with #)
      if (line.startsWith('### ')) {
        doc.fontSize(14).font('Helvetica-Bold').text(line.replace('### ', ''));
        doc.moveDown(0.3);
      } else if (line.startsWith('## ')) {
        doc.fontSize(16).font('Helvetica-Bold').text(line.replace('## ', ''));
        doc.moveDown(0.3);
      } else if (line.startsWith('# ')) {
        doc.fontSize(18).font('Helvetica-Bold').text(line.replace('# ', ''));
        doc.moveDown(0.3);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`  • ${line.substring(2)}`, { indent: 10 });
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered lists
        doc.fontSize(11).font('Helvetica').text(`  ${line}`, { indent: 10 });
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.fontSize(11).font('Helvetica-Bold').text(line.replace(/\*\*/g, ''));
      } else if (line.trim() === '') {
        // Empty line
        doc.moveDown(0.5);
      } else {
        // Regular text
        doc.fontSize(11).font('Helvetica').text(line);
      }
    }

    // Add footer with page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(`Page ${i + 1} of ${pages.count}`, 50, 780, {
          align: 'center',
          width: 495,
        });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('PDF Download Error:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};
