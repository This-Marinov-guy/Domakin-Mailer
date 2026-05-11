import type { Request, Response, NextFunction } from "express";
import {
  sendListRoomToPreCurrentYear,
  sendRemoteViewingToSearchRentings,
} from "../services/send-broadcast-email.js";

export async function sendRemoteViewingBroadcast(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await sendRemoteViewingToSearchRentings();
    res.json({
      ok: true,
      message: "Remote viewing broadcast sent",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendListRoomBroadcast(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await sendListRoomToPreCurrentYear();
    res.json({
      ok: true,
      message: "List room broadcast sent",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
