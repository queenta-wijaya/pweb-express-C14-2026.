import { Router } from "express";
import heroRouter from "./hero.routes";
import skinRouter from "./skin.routes";
import playerRoutes from "./player.routes";
import statisticsRouter from "./statistics.routes";

const router = Router();

router.use("/heroes", heroRouter);
router.use("/skins", skinRouter);
router.use("/players", playerRoutes);
router.use("/statistics", statisticsRouter);

export default router;
