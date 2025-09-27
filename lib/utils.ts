import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from 'query-string';

// No changes needed, this is a standard and efficient utility.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- URL Query Functions ---

interface UrlQueryParams {
  params: string;
  key: string;
  value: string | null;
}

export const formUrlQuery = ({ params, key, value }: UrlQueryParams) => {
  // Prevent errors during server-side rendering where 'window' is not available.
  if (typeof window === 'undefined') return '';

  const currentUrl = qs.parse(params);
  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  );
};

interface RemoveUrlQueryParams {
  params: string;
  keysToRemove: string[];
}

export const removeKeysFromQuery = ({ params, keysToRemove }: RemoveUrlQueryParams) => {
  // Prevent errors during server-side rendering.
  if (typeof window === 'undefined') return '';

  const currentUrl = qs.parse(params);
  keysToRemove.forEach((key) => {
    delete currentUrl[key];
  });

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  );
};

// --- Date and Time Formatters ---

export const dateConverter = (inputDateString: string) => {
  // Guard clause for empty or invalid input to prevent errors.
  if (!inputDateString) return "Date not available";

  const inputDate = new Date(inputDateString);

  // Check for invalid date after parsing.
  if (isNaN(inputDate.getTime())) return "Invalid Date";

  // 'Intl' is a powerful, built-in API for date/time formatting.
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(inputDate);
};

export const timeFormatConverter = (timeString: string) => {
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
    return '--';
  }
  // Guard clause for empty or invalid input.
  if (!timeString || !timeString.includes(':')) return "Time not available";

  const [hours, minutes] = timeString.split(':');
  let formattedHours = parseInt(hours, 10);
  const ampm = formattedHours >= 12 ? 'PM' : 'AM';

  // Convert 24-hour time to 12-hour time (e.g., 0 -> 12, 13 -> 1).
  formattedHours = formattedHours % 12 || 12;

  // No change needed to minutes, they are correct as is.
  return `${formattedHours}:${minutes} ${ampm}`;
};


// --- File Utility ---

// This is a concise wrapper and needs no changes. It's correctly a client-side utility.
export const convertFileToUrl = (file: File) => URL.createObjectURL(file);