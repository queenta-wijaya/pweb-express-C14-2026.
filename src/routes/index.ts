import { Router } from "express";
import heroRouter from "./hero.routes";
import skinRouter from "./skin.routes";

const router = Router();

router.use("/heroes", heroRouter);
router.use("/skins", skinRouter);

export default router;
