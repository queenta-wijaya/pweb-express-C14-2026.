import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import prisma from "../config/prisma";
import { isRarity } from "../utils/enums";
import { HttpError } from "../utils/http-error";
import { parseId, parsePagination } from "../utils/parse";
import { sendSuccess } from "../utils/response";

export const getAllSkins = async (req: Request, res: Response): Promise<void> => {
  const { currentPage, limit, skip } = parsePagination(
    req.query.page,
    req.query.limit,
  );
  const where: Prisma.SkinWhereInput = {};

  if (req.query.heroId !== undefined) {
    if (typeof req.query.heroId !== "string") {
      throw new HttpError(400, "heroId harus berupa bilangan bulat positif");
    }
    where.heroId = parseId(req.query.heroId);
  }
  if (req.query.rarity !== undefined) {
    if (!isRarity(req.query.rarity)) {
      throw new HttpError(400, "Rarity tidak valid");
    }
    where.rarity = req.query.rarity;
  }

  const [skins, totalItems] = await prisma.$transaction([
    prisma.skin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "asc" },
      include: { hero: { select: { name: true } } },
    }),
    prisma.skin.count({ where }),
  ]);

  sendSuccess(res, 200, "Berhasil mengambil data skin", skins, {
    currentPage,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  });
};

export const getSkinById = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.skin_id);
  const skin = await prisma.skin.findUnique({
    where: { id },
    include: { hero: true },
  });

  if (!skin) {
    throw new HttpError(404, "Skin tidak ditemukan");
  }

  sendSuccess(res, 200, "Berhasil mengambil detail skin", skin);
};
