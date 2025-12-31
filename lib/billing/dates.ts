export function addOneMonth(from: Date) {
  const date = new Date(from);
  const day = date.getUTCDate();

  // add month in UTC
  date.setUTCMonth(date.getUTCMonth() + 1);

  // handle month overflow (e.g. Jan 31 -> Feb)
  if (date.getUTCDate() < day) {
    // move to last day of previous month
    date.setUTCDate(0);
  }
  return date;
}
