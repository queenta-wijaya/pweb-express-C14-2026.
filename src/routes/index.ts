import { Router } from "express";
import heroRouter from "./hero.routes";
import skinRouter from "./skin.routes";
import playerRoutes from "./player.routes";

const router = Router();

router.use("/heroes", heroRouter);
router.use("/skins", skinRouter);
router.use("/players", playerRoutes);

export default router;
