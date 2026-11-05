import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { sendSuccess } from "../utils/response";

export const createPlayer = async (req: Request, res: Response): Promise<void> => {
  const { nickname } = req.body;

  if (typeof nickname !== "string" || nickname.trim() === "") {
    throw new HttpError(400, "Nickname tidak boleh kosong");
  }

  const existingPlayer = await prisma.player.findUnique({
    where: { nickname: nickname.trim() }
  });

  if (existingPlayer) {
    throw new HttpError(409, "Nickname sudah dipakai");
  }

  const player = await prisma.player.create({
    data: { nickname: nickname.trim() }
  });

  sendSuccess(res, 201, "Player berhasil dibuat", player);
};

export const getPlayerDetail = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.player_id);
  
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      playerHeroes: { include: { hero: true } }
    }
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const formattedHeroes = player.playerHeroes.map(ph => ({
    heroId: ph.heroId,
    name: ph.hero.name,
    currency: ph.currency,
    pricePaid: ph.pricePaid
  }));

  sendSuccess(res, 200, "Berhasil mengambil data player", {
    id: player.id,
    nickname: player.nickname,
    bp: player.bp,
    diamond: player.diamond,
    createdAt: player.createdAt,
    heroes: formattedHeroes
  });
};

export const updatePlayer = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.player_id);
  const { nickname } = req.body;

  if (typeof nickname !== "string" || nickname.trim() === "") {
    throw new HttpError(400, "Nickname tidak boleh kosong");
  }

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const existingPlayer = await prisma.player.findUnique({
    where: { nickname: nickname.trim() }
  });
  
  if (existingPlayer && existingPlayer.id !== id) {
    throw new HttpError(409, "Nickname sudah dipakai player lain");
  }

  const updatedPlayer = await prisma.player.update({
    where: { id },
    data: { nickname: nickname.trim() }
  });

  sendSuccess(res, 200, "Player berhasil diupdate", updatedPlayer);
};

export const deletePlayer = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.player_id);

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  await prisma.player.delete({ where: { id } });

  sendSuccess(res, 200, "Player berhasil dihapus", null);
};



export const topUpDiamond = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.player_id);
  const { amount } = req.body;

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "Amount harus bilangan bulat lebih dari 0");
  }

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updatedPlayer = await prisma.player.update({
    where: { id },
    data: { diamond: { increment: amount } }
  });

  sendSuccess(res, 200, "Top up berhasil", {
    playerId: updatedPlayer.id,
    amount: amount,
    diamond: updatedPlayer.diamond
  });
};

export const addMatchResult = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.player_id);
  const { result } = req.body;

  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "Result harus WIN atau LOSE");
  }

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const bpEarned = result === "WIN" ? 300 : 100;

  const updatedPlayer = await prisma.player.update({
    where: { id },
    data: { bp: { increment: bpEarned } }
  });

  sendSuccess(res, 200, "Hadiah match berhasil ditambahkan", {
    playerId: updatedPlayer.id,
    result: result,
    bpEarned: bpEarned,
    bp: updatedPlayer.bp
  });
};

export const buyHero = async (req: Request, res: Response): Promise<void> => {
  const playerId = parseId(req.params.player_id);
  const { heroId, currency } = req.body;

  const numHeroId =
    typeof heroId === "number"
      ? heroId
      : typeof heroId === "string" && heroId.trim() !== ""
        ? Number(heroId)
        : NaN;

  // 1. heroId kosong, atau currency bukan BP/DIAMOND -> 400
  if (
    !Number.isInteger(numHeroId) ||
    numHeroId <= 0 ||
    (currency !== "BP" && currency !== "DIAMOND")
  ) {
    throw new HttpError(400, "heroId dan currency (BP atau DIAMOND) harus diisi");
  }

  // 2. Player tidak ditemukan -> 404
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // 3. Hero tidak ditemukan -> 404
  const hero = await prisma.hero.findUnique({ where: { id: numHeroId } });
  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  // 4. Harga hero untuk currency tersebut kosong -> 400
  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null || price === undefined) {
    throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
  }

  // 5. Player sudah memiliki hero tersebut -> 409
  const alreadyOwned = await prisma.playerHero.findUnique({
    where: {
      playerId_heroId: {
        playerId,
        heroId: numHeroId,
      },
    },
  });
  if (alreadyOwned) {
    throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
  }

  // 6. Saldo player kurang dari harga hero -> 400
  const balance = currency === "BP" ? player.bp : player.diamond;
  if (balance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak mencukupi untuk membeli hero ini`);
  }

  // Simpan dengan transaction: decrement saldo dan buat PlayerHero
  const [updatedPlayer, playerHero] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data: {
        ...(currency === "BP"
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } }),
      },
    }),
    prisma.playerHero.create({
      data: {
        playerId,
        heroId: numHeroId,
        currency,
        pricePaid: price,
      },
    }),
  ]);

  sendSuccess(res, 201, "Hero berhasil dibeli", {
    hero: {
      id: hero.id,
      name: hero.name,
    },
    currency: playerHero.currency,
    pricePaid: playerHero.pricePaid,
    balance: {
      bp: updatedPlayer.bp,
      diamond: updatedPlayer.diamond,
    },
  });
};
