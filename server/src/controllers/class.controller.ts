import { Response, NextFunction } from 'express';
import { ClassStatus } from '@prisma/client';
import { classSessionService } from '../services/class-session.service.js';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';

/**
 * GET /classes
 * List class sessions
 */
export const list = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { locationId, classTypeId, instructorId, startDate, endDate, status } = req.query;

    const classes = await classSessionService.list({
      tenantId: req.tenantId,
      locationId: locationId as string,
      classTypeId: classTypeId as string,
      instructorId: instructorId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as ClassStatus,
    });

    res.json({
      success: true,
      data: { classes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /classes/schedule
 * Get weekly schedule
 */
export const getSchedule = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { startDate, locationId } = req.query;

    // Default to start of current week
    let weekStart: Date;
    if (startDate) {
      weekStart = new Date(startDate as string);
    } else {
      weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    }

    const classes = await classSessionService.getWeeklySchedule(
      req.tenantId,
      weekStart,
      locationId as string
    );

    res.json({
      success: true,
      data: { classes, weekStart },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /classes/:id
 * Get class session details
 */
export const getById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const classSession = await classSessionService.getById(id, req.tenantId);

    if (!classSession) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Class not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { class: classSession },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /classes
 * Schedule a new class
 */
export const create = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { locationId, classTypeId, instructorId, startTime, endTime, capacity } = req.body;

    const classSession = await classSessionService.create({
      tenantId: req.tenantId,
      locationId,
      classTypeId,
      instructorId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity,
    });

    res.status(201).json({
      success: true,
      data: { class: classSession },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /classes/:id
 * Update a class session
 */
export const update = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const { instructorId, startTime, endTime, capacity } = req.body;

    const classSession = await classSessionService.update(id, req.tenantId, {
      instructorId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      capacity,
    });

    res.json({
      success: true,
      data: { class: classSession },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /classes/:id
 * Cancel a class
 */
export const cancel = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    await classSessionService.cancel(id, req.tenantId, reason);

    res.json({
      success: true,
      data: { message: 'Class cancelled' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /classes/:id/roster
 * Get class roster
 */
export const getRoster = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const roster = await classSessionService.getRoster(id, req.tenantId);

    res.json({
      success: true,
      data: { roster },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /classes/:id/waitlist
 * Get class waitlist
 */
export const getWaitlist = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const waitlist = await classSessionService.getWaitlist(id, req.tenantId);

    res.json({
      success: true,
      data: { waitlist },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /classes/:id/start
 * Mark class as in progress
 */
export const startClass = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const classSession = await classSessionService.startClass(id, req.tenantId);

    res.json({
      success: true,
      data: { class: classSession },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /classes/:id/complete
 * Mark class as completed
 */
export const completeClass = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tenant context required' },
      });
      return;
    }

    const { id } = req.params;
    const classSession = await classSessionService.completeClass(id, req.tenantId);

    res.json({
      success: true,
      data: { class: classSession },
    });
  } catch (error) {
    next(error);
  }
};
