import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Currency, Prisma } from "../src/generated/prisma/client";
import prisma from "../src/config/prisma";
import { isLane, isRarity, isRole } from "../src/utils/enums";

interface HeroJson {
  name: string;
  primaryRole: string;
  primaryLane: string;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
}

interface SkinJson {
  name: string;
  heroId: number;
  rarity: string;
  priceDiamond: number | null;
}

const readJson = async <T>(fileName: string): Promise<T> => {
  const filePath = resolve(process.cwd(), "data", fileName);
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
};

const validatePrice = (value: unknown, fieldName: string): number | null => {
  if (
    value !== null &&
    (typeof value !== "number" || !Number.isInteger(value) || value < 0)
  ) {
    throw new Error(`${fieldName} pada dataset harus null atau bilangan bulat non-negatif`);
  }
  return value;
};

const seed = async (): Promise<void> => {
  try {
    const heroes = await readJson<HeroJson[]>("heroes.json");
    const skins = await readJson<SkinJson[]>("skins.json");

    if (heroes.length !== 133 || skins.length !== 892) {
      throw new Error(
        `Dataset tidak lengkap: ditemukan ${heroes.length} hero dan ${skins.length} skin`,
      );
    }

    const heroData: Prisma.HeroCreateManyInput[] = heroes.map((hero) => {
      if (
        !hero.name ||
        !isRole(hero.primaryRole) ||
        !isLane(hero.primaryLane) ||
        !Number.isInteger(hero.releaseYear) ||
        hero.releaseYear <= 0
      ) {
        throw new Error(`Data hero tidak valid: ${hero.name || "(tanpa nama)"}`);
      }

      return {
        name: hero.name,
        role: hero.primaryRole,
        lane: hero.primaryLane,
        releaseYear: hero.releaseYear,
        priceBP: validatePrice(hero.priceBP, "priceBP"),
        priceDiamond: validatePrice(hero.priceDiamond, "priceDiamond"),
      };
    });

    const skinData: Prisma.SkinCreateManyInput[] = skins.map((skin) => {
      if (
        !skin.name ||
        !Number.isInteger(skin.heroId) ||
        skin.heroId <= 0 ||
        !isRarity(skin.rarity)
      ) {
        throw new Error(`Data skin tidak valid: ${skin.name || "(tanpa nama)"}`);
      }

      return {
        name: skin.name,
        heroId: skin.heroId,
        rarity: skin.rarity,
        priceDiamond: validatePrice(skin.priceDiamond, "priceDiamond"),
      };
    });

    await prisma.$executeRaw`TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE`;
    await prisma.hero.createMany({ data: heroData });
    await prisma.skin.createMany({ data: skinData });
    await prisma.player.createMany({
      data: [
        { nickname: "ArekITS", bp: 1500, diamond: 75 },
        { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
        { nickname: "MageSurabaya", bp: 10000, diamond: 0 },
      ],
    });
    await prisma.playerHero.createMany({
      data: [
        { playerId: 1, heroId: 18, currency: Currency.BP, pricePaid: 2000 },
        { playerId: 1, heroId: 1, currency: Currency.BP, pricePaid: 10800 },
        { playerId: 2, heroId: 84, currency: Currency.DIAMOND, pricePaid: 599 },
        { playerId: 2, heroId: 56, currency: Currency.BP, pricePaid: 32000 },
      ],
    });

    console.log(`Seed berhasil: ${heroData.length} hero, ${skinData.length} skin, 3 player`);
  } finally {
    await prisma.$disconnect();
  }
};

await seed();
