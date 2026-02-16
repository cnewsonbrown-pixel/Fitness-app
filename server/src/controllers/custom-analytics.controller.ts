import { Request, Response, NextFunction } from 'express';
import { customAnalyticsService } from '../services/custom-analytics.service.js';

export const getDashboards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await customAnalyticsService.getDashboards(req.tenantId!, req.params.staffId || '');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const saveDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await customAnalyticsService.saveDashboard(req.tenantId!, req.body.staffId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const resolveWidget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await customAnalyticsService.resolveWidget(req.tenantId!, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await customAnalyticsService.generateReport(req.tenantId!, {
      name: req.body.name || 'Report',
      type: req.body.type,
      filters: {
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        locationId: req.body.locationId,
        classTypeId: req.body.classTypeId,
        membershipTypeId: req.body.membershipTypeId,
      },
      columns: req.body.columns,
      groupBy: req.body.groupBy,
      format: req.body.format,
    });

    if (req.body.format === 'csv') {
      const csv = customAnalyticsService.exportToCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.csv"`);
      return res.send(csv);
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
