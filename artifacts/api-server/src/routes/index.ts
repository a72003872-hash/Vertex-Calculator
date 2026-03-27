import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vertexRouter from "./vertex";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vertexRouter);

export default router;
