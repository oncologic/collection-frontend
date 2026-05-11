import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#334155",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#64748b",
  },
  tiersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  tierWrapper: {
    width: "48%", // Three columns per row with gap
    marginBottom: 16,
  },
  card: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tierName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  tierPrice: {
    fontSize: 14,
    color: "#64748b",
  },
  benefitsSection: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginBottom: 8,
  },
  benefitsList: {
    gap: 6,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  checkmark: {
    fontSize: 11,
    color: "#10b981",
    marginRight: 6,
    marginTop: 1,
  },
  benefitText: {
    fontSize: 10,
    color: "#334155",
    flex: 1,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 12,
    color: "#334155",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 12,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
  },
  organizerName: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    color: "#334155",
    fontFamily: "Helvetica-Bold",
  },
});

const SponsorshipPdfDocument = ({ sponsorships, event }) => {
  // Get organizer info from first sponsorship (they should all be the same)
  const organizerInfo = sponsorships[0] || {};

  // Sort sponsorships by price (highest to lowest)
  const sortedSponsorships = [...sponsorships].sort(
    (a, b) => (b.price || 0) - (a.price || 0)
  );

  // Format event dates
  const formatEventDates = () => {
    if (!event?.startDate) return null;

    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;

    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    return `${startDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    })} - ${endDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {event?.name || "Event Sponsorships"}
          </Text>
          <Text style={styles.organizerName}>
            {organizerInfo.organizerName}
          </Text>
          <Text style={styles.subtitle}>Sponsorship Opportunities</Text>
          <Text style={styles.subtitle}>{event?.title || ""}</Text>

          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              Generated on {new Date().toLocaleDateString()}
            </Text>
            {formatEventDates() && (
              <Text style={styles.metaText}>
                Event Date: {formatEventDates()}
              </Text>
            )}
            <Text style={styles.metaText}>
              {sponsorships.length} Sponsorship Tier
              {sponsorships.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.tiersContainer}>
          {sortedSponsorships.map((tier) => (
            <View key={tier.id} style={styles.tierWrapper}>
              <View style={styles.card}>
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>
                    {tier.price
                      ? "$" + Math.round(tier.price).toLocaleString()
                      : "*"}
                  </Text>
                </View>

                <View style={styles.benefitsSection}>
                  <Text style={styles.benefitsTitle}>Benefits Included:</Text>
                  <View style={styles.benefitsList}>
                    {tier.items
                      .sort((a, b) => a.orderPosition - b.orderPosition)
                      .map((item, index) => (
                        <View key={index} style={styles.benefitItem}>
                          <Text style={styles.checkmark}>✓</Text>
                          <Text style={styles.benefitText}>{item.name}</Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For more information about sponsorship opportunities, please
            contact:
          </Text>
          <Text style={styles.contactInfo}>{organizerInfo.contactName}</Text>
          <Text style={styles.contactInfo}>{organizerInfo.contactEmail}</Text>
          <Text style={styles.footerNote}>
            All sponsorship levels include recognition on event materials where
            applicable.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default SponsorshipPdfDocument;
