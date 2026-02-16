import { Request, Response, NextFunction } from 'express';
import { videoService } from '../services/video.service.js';

// Programs
export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.createProgram(req.tenantId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.updateProgram(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await videoService.deleteProgram(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    next(error);
  }
};

export const getProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.getProgram(req.tenantId!, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publishedOnly, category } = req.query;
    const data = await videoService.listPrograms(req.tenantId!, {
      publishedOnly: publishedOnly === 'true',
      category: category as string,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Videos
export const createVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.createVideo(req.tenantId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.updateVideo(req.tenantId!, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await videoService.deleteVideo(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
};

export const getVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.getVideo(req.tenantId!, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publishedOnly, programId, level } = req.query;
    const data = await videoService.listVideos(req.tenantId!, {
      publishedOnly: publishedOnly === 'true',
      programId: programId as string,
      level: level as string,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Progress
export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { watchedSeconds, totalSeconds } = req.body;
    const data = await videoService.updateProgress(
      req.tenantId!,
      req.params.memberId || (req as any).memberId,
      req.params.videoId,
      watchedSeconds,
      totalSeconds
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMemberProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = req.params.memberId || (req as any).memberId;
    const data = await videoService.getMemberProgress(req.tenantId!, memberId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Analytics
export const getVideoAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.getVideoAnalytics(req.tenantId!, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getLibraryAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await videoService.getLibraryAnalytics(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
