import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { formatDataForDocument } from "./collectionUtils";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
} from "@react-pdf/renderer";

export const generatePDF = async (data) => {
  const formattedData = formatDataForDocument(data);
  const doc = new jsPDF();
  let yPos = 20;
  const lineHeight = 10;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const maxWidth = pageWidth - margin * 2; // Available width for text

  // Helper function to handle long text
  const addWrappedText = (text, y, fontSize = 12) => {
    doc.setFontSize(fontSize);

    // Truncate very long text if needed
    const maxLength = 1000; // Set a reasonable maximum length
    const truncatedText =
      text?.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text || "";

    const splitText = doc.splitTextToSize(truncatedText, maxWidth);

    // Check if we need a new page
    if (
      y + splitText.length * lineHeight >
      doc.internal.pageSize.height - margin
    ) {
      doc.addPage();
      y = margin;
    }

    doc.text(splitText, margin, y);
    return y + splitText.length * lineHeight;
  };

  // Title
  doc.setFontSize(16);
  const truncatedTitle =
    formattedData.event.title?.length > 50
      ? formattedData.event.title.substring(0, 50) + "..."
      : formattedData.event.title;
  yPos = addWrappedText(truncatedTitle, yPos, 16);
  yPos += lineHeight;

  // Event details
  doc.setFontSize(12);
  yPos = addWrappedText(`Date: ${formattedData.event.date}`, yPos);
  yPos = addWrappedText(`Location: ${formattedData.event.location}`, yPos);
  yPos += lineHeight;

  // Event description
  if (formattedData.event.description) {
    doc.setFontSize(14);
    yPos = addWrappedText("Event Description:", yPos, 14);
    yPos = addWrappedText(formattedData.event.description, yPos);
    yPos += lineHeight;
  }

  // Collections
  formattedData.collections.forEach((collection, index) => {
    // Collection name
    doc.setFontSize(14);
    const collectionTitle = `Collection ${index + 1}: ${collection.name}`;
    yPos = addWrappedText(collectionTitle, yPos, 14);
    yPos += lineHeight;

    // Collection description
    if (collection.description) {
      yPos = addWrappedText(collection.description, yPos);
      yPos += lineHeight;
    }

    // External Links
    collection.externalLinks?.forEach((link, linkIndex) => {
      // Link name
      const linkTitle = `Link ${linkIndex + 1}: ${link.name}`;
      yPos = addWrappedText(linkTitle, yPos);

      // URL
      if (link.url) {
        doc.setTextColor(0, 0, 255);
        yPos = addWrappedText(link.url, yPos);
        doc.setTextColor(0, 0, 0);
      }

      // Link description
      if (link.description) {
        yPos = addWrappedText(link.description, yPos);
      }

      // Notations
      link.notations?.forEach((notation, notationIndex) => {
        const noteTitle = `Note ${notationIndex + 1}: ${notation.title}`;
        yPos = addWrappedText(noteTitle, yPos, 12, margin + 10);

        if (notation.notes) {
          yPos = addWrappedText(notation.notes, yPos);
        }
        yPos += lineHeight / 2;
      });

      yPos += lineHeight;
    });

    yPos += lineHeight;
  });

  return doc;
};

export const convertToCSV = (data) => {
  const formattedData = formatDataForDocument(data);
  const rows = [];

  // Headers
  rows.push(
    [
      "Section",
      "Collection",
      "Item Type",
      "Name/Title",
      "Description",
      "Notes",
      "URL",
      "Date Added",
    ].join(",")
  );

  // Event details
  rows.push(
    [
      "Event Details",
      "",
      "Event",
      formattedData.event.title,
      formattedData.event.description,
      formattedData.event.notes,
      "",
      formattedData.event.date,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );

  // Collections and their items
  formattedData.collections.forEach((collection) => {
    rows.push(
      [
        "Collection",
        "",
        "Collection",
        collection.name,
        collection.description,
        collection.notes,
        "",
        "",
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    );

    collection.externalLinks?.forEach((link) => {
      rows.push(
        [
          "External Link",
          collection.name,
          "Link",
          link.name,
          link.description,
          link.notes,
          link.url,
          "",
        ]
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",")
      );

      link.notations?.forEach((notation) => {
        rows.push(
          [
            "Notation",
            collection.name,
            "Note",
            notation.title,
            "",
            notation.notes,
            "",
            "",
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        );
      });
    });
  });

  return rows.join("\n");
};

export const convertToTSV = (data) => {
  const formattedData = formatDataForDocument(data);
  const rows = [];

  // Headers
  rows.push(
    [
      "Section",
      "Collection",
      "Item Type",
      "Name/Title",
      "Description",
      "Notes",
      "URL",
      "Date Added",
    ].join("\t")
  );

  // Event details
  rows.push(
    [
      "Event Details",
      "",
      "Event",
      formattedData.event.title,
      formattedData.event.description,
      formattedData.event.notes,
      "",
      formattedData.event.date,
    ]
      .map((field) => String(field).replace(/\t/g, " "))
      .join("\t")
  );

  // Collections and their items
  formattedData.collections.forEach((collection) => {
    rows.push(
      [
        "Collection",
        "",
        "Collection",
        collection.name,
        collection.description,
        collection.notes,
        "",
        "",
      ]
        .map((field) => String(field).replace(/\t/g, " "))
        .join("\t")
    );

    collection.externalLinks?.forEach((link) => {
      rows.push(
        [
          "External Link",
          collection.name,
          "Link",
          link.name,
          link.description,
          link.notes,
          link.url,
          "",
        ]
          .map((field) => String(field).replace(/\t/g, " "))
          .join("\t")
      );

      link.notations?.forEach((notation) => {
        rows.push(
          [
            "Notation",
            collection.name,
            "Note",
            notation.title,
            "",
            notation.notes,
            "",
            "",
          ]
            .map((field) => String(field).replace(/\t/g, " "))
            .join("\t")
        );
      });
    });
  });

  return rows.join("\n");
};

const MyPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{data.event.title}</Text>
        {data.collections.map((collection) => (
          <View key={collection.id} style={styles.collection}>
            <Text style={styles.collectionTitle}>{collection.name}</Text>
            {collection.externalLinks?.map((link) => (
              <View key={link.id} style={styles.link}>
                <Text>{link.name}</Text>
                <Text style={styles.url}>{link.url}</Text>
                {link.notations?.map((notation) => (
                  <View key={notation.id} style={styles.notation}>
                    <Text>{notation.title}</Text>
                    <Text>{notation.notes}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
