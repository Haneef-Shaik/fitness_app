/**
 * Month and weekday names. Weekdays start on Sunday to match Date#getUTCDay(); the product week
 * still runs Monday to Sunday (PRD §4.2). Names are tables rather than Intl output so en-IN and
 * hi-IN text is identical on Hermes, JSC and Node.
 */
export interface CalendarNames {
  readonly monthsShort: readonly string[];
  readonly monthsLong: readonly string[];
  readonly weekdaysNarrow: readonly string[];
  readonly weekdaysShort: readonly string[];
  readonly weekdaysLong: readonly string[];
}

export const calendarEn: CalendarNames = {
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  weekdaysNarrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

export const calendarHi: CalendarNames = {
  monthsShort: ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल॰', 'अग॰', 'सित॰', 'अक्तू॰', 'नव॰', 'दिस॰'],
  monthsLong: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर'],
  weekdaysNarrow: ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'],
  weekdaysShort: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  weekdaysLong: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
};
