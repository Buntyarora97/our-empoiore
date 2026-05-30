import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import marketsRouter from "./markets";
import betsRouter from "./bets";
import walletRouter from "./wallet";
import resultsRouter from "./results";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(marketsRouter);
router.use(betsRouter);
router.use(walletRouter);
router.use(resultsRouter);
router.use(adminRouter);

export default router;
