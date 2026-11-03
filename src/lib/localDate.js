// Calendar dates as YYYY-MM-DD, built from the local calendar fields.
//
// Never format a date with toISOString(): it converts to UTC first, so a local
// midnight in any timezone ahead of UTC becomes the previous calendar day. That
// is what made imported matches land one day early.

export const toIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayIso = () => toIsoDate(new Date());