/**
 * Common Indian couriers with public tracking URL templates. `{awb}` is
 * replaced with the tracking / AWB number. Admin can also enter a custom
 * courier + URL.
 */
export const COURIERS: { name: string; trackingUrl: string }[] = [
  { name: "Delhivery", trackingUrl: "https://www.delhivery.com/track-v2/package/{awb}" },
  { name: "Blue Dart", trackingUrl: "https://www.bluedart.com/tracking?trackingNo={awb}" },
  { name: "DTDC", trackingUrl: "https://www.dtdc.in/trace.asp?strCnno={awb}" },
  { name: "Ekart", trackingUrl: "https://ekartlogistics.com/shipmenttrack/{awb}" },
  { name: "XpressBees", trackingUrl: "https://www.xpressbees.com/shipment/tracking?awbNo={awb}" },
  { name: "Ecom Express", trackingUrl: "https://ecomexpress.in/tracking/?awb_field={awb}" },
  { name: "Shadowfax", trackingUrl: "https://tracker.shadowfax.in/#/track/{awb}" },
  { name: "India Post", trackingUrl: "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?awb={awb}" },
  { name: "Gati", trackingUrl: "https://www.gati.com/track-your-shipment/?docket={awb}" },
  { name: "Safexpress", trackingUrl: "https://www.safexpress.com/track-shipment?waybill={awb}" },
  { name: "Professional Couriers", trackingUrl: "https://www.tpcindia.com/Tracking2014.aspx?id={awb}" },
  { name: "Shiprocket", trackingUrl: "https://shiprocket.co/tracking/{awb}" },
  { name: "Hand delivery / own fleet", trackingUrl: "" },
];

export function buildTrackingUrl(courier: string, awb: string, custom?: string | null): string | null {
  if (custom && custom.trim()) return custom.trim().replace("{awb}", encodeURIComponent(awb));
  const match = COURIERS.find((c) => c.name.toLowerCase() === courier.trim().toLowerCase());
  if (!match || !match.trackingUrl || !awb.trim()) return null;
  return match.trackingUrl.replace("{awb}", encodeURIComponent(awb.trim()));
}
