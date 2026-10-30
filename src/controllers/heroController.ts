import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { isLane, isRole } from "../utils/enums";
import { parseId, parsePagination } from "../utils/parse";
import { sendSuccess } from "../utils/response";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseOptionalPrice = (
  value: unknown,
  fieldName: string,
): number | null | undefined => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new HttpError(400, `${fieldName} harus berupa bilangan bulat non-negatif`);
  }

  return value;
};

export const getAllHeroes = async (req: Request, res: Response): Promise<void> => {
  const { currentPage, limit, skip } = parsePagination(
    req.query.page,
    req.query.limit,
  );
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const where: Prisma.HeroWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (req.query.role !== undefined) {
    if (!isRole(req.query.role)) {
      throw new HttpError(400, "Role tidak valid");
    }
    where.role = req.query.role;
  }

  const [heroes, totalItems] = await prisma.$transaction([
    prisma.hero.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.hero.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data hero", heroes, {
    currentPage,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  });
};

export const getHeroById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.hero_id);
  const hero = await prisma.hero.findUnique({
    where: { id },
    include: { skins: true },
  });

  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  sendSuccess(res, 200, "Berhasil mengambil detail hero", hero);
};

export const createHero = async (req: Request, res: Response): Promise<void> => {
  const body: unknown = req.body;

  if (!isRecord(body)) {
    throw new HttpError(400, "Body harus berupa object JSON");
  }

  const { name, role, lane, releaseYear } = body;
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    !isRole(role) ||
    !isLane(lane) ||
    typeof releaseYear !== "number" ||
    !Number.isInteger(releaseYear) ||
    releaseYear <= 0
  ) {
    throw new HttpError(
      400,
      "name, role, lane, dan releaseYear wajib diisi dengan nilai yang valid",
    );
  }

  const existingHero = await prisma.hero.findUnique({
    where: { name: name.trim() },
    select: { id: true },
  });

  if (existingHero) {
    throw new HttpError(409, "Nama hero sudah digunakan");
  }

  const priceBP = parseOptionalPrice(body.priceBP, "priceBP");
  const priceDiamond = parseOptionalPrice(body.priceDiamond, "priceDiamond");
  const hero = await prisma.hero.create({
    data: {
      name: name.trim(),
      role,
      lane,
      releaseYear,
      priceBP,
      priceDiamond,
    },
  });

  sendSuccess(res, 201, "Hero berhasil dibuat", hero);
};
