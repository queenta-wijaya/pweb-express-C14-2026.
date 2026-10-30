import { HttpError } from "./http-error";

export const parseId = (value: unknown): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "ID harus berupa bilangan bulat positif");
  }
  return id;
};

const parseQueryNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parsePagination = (pageValue: unknown, limitValue: unknown) => {
  const currentPage = Math.max(Math.trunc(parseQueryNumber(pageValue, 1)) || 1, 1);
  const limit = Math.min(
    Math.max(Math.trunc(parseQueryNumber(limitValue, 10)) || 10, 1),
    100,
  );
  const maxPage = Math.floor(Number.MAX_SAFE_INTEGER / limit);

  return {
    currentPage: Math.min(currentPage, maxPage),
    limit,
    skip: (Math.min(currentPage, maxPage) - 1) * limit,
  };
};
