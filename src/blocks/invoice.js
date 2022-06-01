import { getPayPeriods } from '../models/invoice.js'

export function invoicePeriods() {
  return getPayPeriods().map(payPeriod => ({
      "text": {
        "type": "plain_text",
        "text": `${payPeriod.startDate.toLocaleDateString()} - ${payPeriod.endDate.toLocaleDateString()}`,
      },
      "value": `option-${payPeriod.id}`
  }));
}
