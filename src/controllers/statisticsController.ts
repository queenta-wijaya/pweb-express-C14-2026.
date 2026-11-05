import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { sendSuccess } from "../utils/response";

export const getStatistics = async (_req: Request, res: Response): Promise<void> => {
  const [totalPlayers, totalHeroesOwned, diamondAggregate, mostOwnedGroup, rolesGroup] =
    await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({
        _sum: { diamond: true },
      }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: {
          heroId: true,
        },
        orderBy: [
          {
            _count: {
              heroId: "desc",
            },
          },
          {
            heroId: "asc",
          },
        ],
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: {
          role: true,
        },
        orderBy: {
          _count: {
            role: "desc",
          },
        },
      }),
    ]);

  let mostOwnedHero: { heroId: number; name: string; owners: number } | null = null;
  if (mostOwnedGroup.length > 0) {
    const hero = await prisma.hero.findUnique({
      where: { id: mostOwnedGroup[0].heroId },
      select: { name: true },
    });

    mostOwnedHero = {
      heroId: mostOwnedGroup[0].heroId,
      name: hero?.name ?? "",
      owners: mostOwnedGroup[0]._count.heroId,
    };
  }

  const heroesPerRole = rolesGroup.map((rg) => ({
    role: rg.role,
    total: rg._count.role,
  }));

  sendSuccess(res, 200, "Berhasil mengambil statistik", {
    totalPlayers,
    totalHeroesOwned,
    totalDiamond: diamondAggregate._sum.diamond ?? 0,
    mostOwnedHero,
    heroesPerRole,
  });
};

