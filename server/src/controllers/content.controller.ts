import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content.service.js';
import { ArticleStatus } from '@prisma/client';

// ===== ARTICLES =====

export const createArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await contentService.createArticle({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const getArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await contentService.getArticle(req.params.id, req.tenantId!);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const listArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, tag, featured, limit, offset } = req.query;
    const result = await contentService.listArticles(req.tenantId!, {
      status: status as ArticleStatus,
      category: category as string,
      tag: tag as string,
      featured: featured === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const listPublishedArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tag, limit, offset } = req.query;
    const result = await contentService.listArticles(req.tenantId!, {
      status: ArticleStatus.PUBLISHED,
      category: category as string,
      tag: tag as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await contentService.updateArticle(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
};

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contentService.deleteArticle(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) { next(error); }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await contentService.getCategories(req.tenantId!);
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

// ===== BOOKMARKS =====

export const bookmarkArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contentService.bookmarkArticle(req.body.memberId, req.params.id);
    res.json({ success: true, message: 'Bookmarked' });
  } catch (error) { next(error); }
};

export const removeBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contentService.removeBookmark(req.body.memberId, req.params.id);
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) { next(error); }
};

export const getBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookmarks = await contentService.getBookmarks(req.params.memberId);
    res.json({ success: true, data: bookmarks });
  } catch (error) { next(error); }
};

// ===== ANNOUNCEMENTS =====

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await contentService.createAnnouncement({ tenantId: req.tenantId!, ...req.body });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) { next(error); }
};

export const listAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.all !== 'true';
    const announcements = await contentService.listAnnouncements(req.tenantId!, activeOnly);
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
};

export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcement = await contentService.updateAnnouncement(req.params.id, req.tenantId!, req.body);
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await contentService.deleteAnnouncement(req.params.id, req.tenantId!);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) { next(error); }
};
