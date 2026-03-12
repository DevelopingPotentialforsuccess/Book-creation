
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, PageNumber, Footer } from 'docx';
import { Book } from '../types';

async function urlToBase64(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function exportBookToWord(book: Book) {
  const children: any[] = [];

  // Title Page
  children.push(
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    new Paragraph({
      text: `By ${book.author}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 1200 },
    })
  );

  if (book.coverImageUrl) {
    try {
      const imageData = await urlToBase64(book.coverImageUrl);
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageData,
              transformation: {
                width: 400,
                height: 500,
              },
            } as any),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 1200 },
        })
      );
    } catch (e) {
      console.warn("Could not include cover image in Word export", e);
    }
  }

  // Table of Contents
  if (book.hasTableOfContents) {
    children.push(
      new Paragraph({
        text: "Table of Contents",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        pageBreakBefore: true,
      })
    );

    book.pages.forEach((page, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: page.title || `Chapter ${i + 1}` }),
            new TextRun({ text: `\t${i + 3}`, bold: true }),
          ],
          spacing: { before: 0, after: 200 },
        })
      );
    });
  }

  // Pages
  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i];
    
    children.push(
      new Paragraph({
        text: page.title || `Chapter ${i + 1}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 0, after: 400 },
        pageBreakBefore: true,
      })
    );

    if (page.imageUrl) {
      try {
        const imageData = await urlToBase64(page.imageUrl);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageData,
                transformation: {
                  width: 450,
                  height: 300,
                },
              } as any),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
          })
        );
      } catch (e) {
        console.warn(`Could not include image for page ${i + 1} in Word export`, e);
      }
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: page.text,
            size: book.fontSize * 2, // docx uses half-points
            font: book.font === 'font-handwritten' || book.font === 'font-patrick' ? "Comic Sans MS" : "Arial",
            shading: book.highlightText ? {
              fill: "FFFF00", // Yellow highlight
              type: "clear",
              color: "auto",
            } : undefined,
          }),
        ],
        spacing: { 
          line: book.lineSpacing * 240, 
          before: 0, 
          after: 0 
        },
      })
    );
  }

  const doc = new Document({
    background: {
      color: book.paperStyle === 'vintage' ? "F4ECD8" : 
             book.paperStyle === 'modern' ? "F8FAFC" : "FFFFFF",
    },
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1584, // 1.1 inches (1 inch = 1440 twips)
              right: 1584,
              bottom: 1584,
              left: 1584,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${book.title}.docx`;
  link.click();
}
