import { Router } from "express";
import {
  createPlayer,
  getPlayerDetail,
  updatePlayer,
  deletePlayer,
  topUpDiamond,
  addMatchResult,
} from "../controllers/playerController";

const router = Router();

router.post("/", createPlayer);
router.get("/:player_id", getPlayerDetail);
router.patch("/:player_id", updatePlayer);
router.delete("/:player_id", deletePlayer);

router.post("/:player_id/topup", topUpDiamond);
router.post("/:player_id/matches", addMatchResult);

export default router;