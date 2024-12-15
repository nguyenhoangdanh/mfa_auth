
import { add } from "date-fns";

export const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const thirtyDaysFromNow = (): Date => {
    const today = new Date();
    return new Date(today.setDate(today.getDate() + 30));
}

export const fortyFiveMinutesFromNow = (): Date => {
    const today = new Date();
    return new Date(today.setMinutes(today.getMinutes() + 45));
}

export const threeMinutesAgo = (): Date => {
    const today = new Date();
    return new Date(today.setMinutes(today.getMinutes() - 3));
}
export const tenMinutesAgo = (): Date => {
    const today = new Date();
    return new Date(today.setMinutes(today.getMinutes() - 10));
}

export const anHourFromNow = (): Date => {
    const today = new Date();
    return new Date(today.setHours(today.getHours() + 1));
}

export const calculateExpirationDate = (expiresIn: string = "15m"): Date => {
    // Match number + unit (m = minutes, h = hours, d = days)
    const match = expiresIn.match(/^(\d+)([mhd])$/);
    if (!match) throw new Error('Invalid format. Use "15m", "1h", or "2d".');
    const [, value, unit] = match;
    const expirationDate = new Date();
  
    // Check the unit and apply accordingly
    switch (unit) {
      case "m": // minutes
        return add(expirationDate, { minutes: parseInt(value) });
      case "h": // hours
        return add(expirationDate, { hours: parseInt(value) });
      case "d": // days
        return add(expirationDate, { days: parseInt(value) });
      default:
        throw new Error('Invalid unit. Use "m", "h", or "d".');
    }
  };