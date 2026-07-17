// date-utils.ts

export type DateInput = Date | string | number;

export type FormatDateOptions = Intl.DateTimeFormatOptions & {
	locale?: Intl.LocalesArgument;
};

const toDate = (value: DateInput): Date => {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new RangeError(`Invalid date: ${String(value)}`);
	}

	return date;
};

export const formatDate = (
	value: DateInput,
	{ locale, ...options }: FormatDateOptions = {},
): string => {
	return new Intl.DateTimeFormat(locale, options).format(toDate(value));
};

export const formatDateOnly = (
	value: DateInput,
	options: FormatDateOptions = {},
): string => {
	return formatDate(value, {
		dateStyle: "medium",
		...options,
	});
};

export const formatTimeOnly = (
	value: DateInput,
	options: FormatDateOptions = {},
): string => {
	return formatDate(value, {
		timeStyle: "short",
		...options,
	});
};

export const formatDateTime = (
	value: DateInput,
	options: FormatDateOptions = {},
): string => {
	return formatDate(value, {
		dateStyle: "medium",
		timeStyle: "short",
		...options,
	});
};

export const toISOString = (value: DateInput): string => {
	return toDate(value).toISOString();
};