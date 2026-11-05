import { Router } from "express";
import {
  createPlayer,
  getPlayerDetail,
  updatePlayer,
  deletePlayer,
  topUpDiamond,
  addMatchResult,
  buyHero,
} from "../controllers/playerController";

const router = Router();

router.post("/", createPlayer);
router.get("/:player_id", getPlayerDetail);
router.patch("/:player_id", updatePlayer);
router.delete("/:player_id", deletePlayer);

router.post("/:player_id/topup", topUpDiamond);
router.post("/:player_id/matches", addMatchResult);
router.post("/:player_id/heroes", buyHero);

export default router;