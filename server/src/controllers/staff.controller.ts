import { Request, Response, NextFunction } from 'express';
import { staffService } from '../services/staff.service.js';
import { instructorService } from '../services/instructor.service.js';

// ============================================
// STAFF CRUD
// ============================================

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.create({
      tenantId: req.tenantId!,
      ...req.body,
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.getById(req.params.id, req.tenantId!);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isInstructor, isActive, locationId } = req.query;

    const staff = await staffService.list({
      tenantId: req.tenantId!,
      role: role as any,
      isInstructor: isInstructor === 'true' ? true : isInstructor === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      locationId: locationId as string,
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const listInstructors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructors = await staffService.listInstructors(
      req.tenantId!,
      req.query.locationId as string
    );
    res.json({ success: true, data: instructors });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.update(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const deactivate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.deactivate(req.params.id, req.tenantId!);
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await staffService.getStats(req.tenantId!);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ============================================
// INSTRUCTOR AVAILABILITY
// ============================================

export const setAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availability = await instructorService.setAvailability({
      instructorId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const availability = await instructorService.getAvailability(req.params.id);
    res.json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};

export const removeAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await instructorService.removeAvailability(req.params.slotId, req.params.id);
    res.json({ success: true, message: 'Availability slot removed' });
  } catch (error) {
    next(error);
  }
};

export const setOverride = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await instructorService.setOverride({
      instructorId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, message: 'Override set' });
  } catch (error) {
    next(error);
  }
};

export const getOverrides = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const overrides = await instructorService.getOverrides(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: overrides });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CERTIFICATIONS
// ============================================

export const addCertification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await instructorService.addCertification({
      staffId: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: cert });
  } catch (error) {
    next(error);
  }
};

export const getCertifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await instructorService.getCertifications(req.params.id);
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
};

export const updateCertification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await instructorService.updateCertification(
      req.params.certId,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: cert });
  } catch (error) {
    next(error);
  }
};

export const removeCertification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await instructorService.removeCertification(req.params.certId, req.params.id);
    res.json({ success: true, message: 'Certification removed' });
  } catch (error) {
    next(error);
  }
};

export const getExpiringCertifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const certs = await instructorService.getExpiringCertifications(req.tenantId!, days);
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
};

// ============================================
// COMPENSATION & SCHEDULE
// ============================================

export const getPaySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await instructorService.getPaySummary({
      instructorId: req.params.id,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    });
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

export const getSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const schedule = await instructorService.getSchedule(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await instructorService.getMetrics(
      req.params.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};
