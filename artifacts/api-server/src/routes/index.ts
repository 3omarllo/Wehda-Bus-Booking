import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingRouter from "./bookings";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingRouter);
router.use(staffRouter);

export default router;
