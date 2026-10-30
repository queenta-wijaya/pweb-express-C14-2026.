import { Lane, Rarity, Role } from "../generated/prisma/client";

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && Object.values(Role).some((role) => role === value);

export const isLane = (value: unknown): value is Lane =>
  typeof value === "string" && Object.values(Lane).some((lane) => lane === value);

export const isRarity = (value: unknown): value is Rarity =>
  typeof value === "string" &&
  Object.values(Rarity).some((rarity) => rarity === value);
