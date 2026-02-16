import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getDashboard(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getPopularTimes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getPopularTimes(req.tenantId!, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRetention = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getRetentionRate(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMemberActivityReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.memberActivityReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.revenueReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.attendanceReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getInstructorPayReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.instructorPayReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
