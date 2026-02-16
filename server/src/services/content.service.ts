import { prisma } from '../config/database.js';
import { ArticleStatus, AnnouncementType } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

// ===== ARTICLES =====

export interface CreateArticleInput {
  tenantId: string;
  title: string;
  body: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  isFeatured?: boolean;
}

export class ContentService {
  async createArticle(input: CreateArticleInput) {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return prisma.article.create({
      data: { ...input, slug },
    });
  }

  async getArticle(id: string, tenantId: string) {
    return prisma.article.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { bookmarks: true } } },
    });
  }

  async getArticleBySlug(slug: string, tenantId: string) {
    return prisma.article.findFirst({
      where: { slug, tenantId, status: ArticleStatus.PUBLISHED },
    });
  }

  async listArticles(tenantId: string, options?: {
    status?: ArticleStatus;
    category?: string;
    tag?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };
    if (options?.status) where.status = options.status;
    if (options?.category) where.category = options.category;
    if (options?.tag) where.tags = { has: options.tag };
    if (options?.featured) where.isFeatured = true;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.article.count({ where }),
    ]);

    return { articles, total };
  }

  async updateArticle(id: string, tenantId: string, data: Partial<CreateArticleInput> & { status?: ArticleStatus }) {
    const article = await prisma.article.findFirst({ where: { id, tenantId } });
    if (!article) throw new NotFoundError('Article not found');

    const updateData: any = { ...data };
    if (data.status === ArticleStatus.PUBLISHED && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return prisma.article.update({ where: { id }, data: updateData });
  }

  async deleteArticle(id: string, tenantId: string) {
    const article = await prisma.article.findFirst({ where: { id, tenantId } });
    if (!article) throw new NotFoundError('Article not found');
    await prisma.article.delete({ where: { id } });
  }

  async getCategories(tenantId: string) {
    const articles = await prisma.article.findMany({
      where: { tenantId, status: ArticleStatus.PUBLISHED, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return articles.map((a) => a.category).filter(Boolean);
  }

  // ===== BOOKMARKS =====

  async bookmarkArticle(memberId: string, articleId: string) {
    return prisma.articleBookmark.upsert({
      where: { memberId_articleId: { memberId, articleId } },
      update: {},
      create: { memberId, articleId },
    });
  }

  async removeBookmark(memberId: string, articleId: string) {
    await prisma.articleBookmark.deleteMany({ where: { memberId, articleId } });
  }

  async getBookmarks(memberId: string) {
    return prisma.articleBookmark.findMany({
      where: { memberId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===== ANNOUNCEMENTS =====

  async createAnnouncement(input: {
    tenantId: string;
    title: string;
    body: string;
    type?: AnnouncementType;
    startsAt?: Date;
    expiresAt?: Date;
  }) {
    return prisma.announcement.create({ data: input });
  }

  async listAnnouncements(tenantId: string, activeOnly = true) {
    const now = new Date();
    const where: any = { tenantId };
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { startsAt: null, expiresAt: null },
        { startsAt: { lte: now }, expiresAt: null },
        { startsAt: null, expiresAt: { gte: now } },
        { startsAt: { lte: now }, expiresAt: { gte: now } },
      ];
    }
    return prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAnnouncement(id: string, tenantId: string, data: any) {
    const ann = await prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!ann) throw new NotFoundError('Announcement not found');
    return prisma.announcement.update({ where: { id }, data });
  }

  async deleteAnnouncement(id: string, tenantId: string) {
    const ann = await prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!ann) throw new NotFoundError('Announcement not found');
    await prisma.announcement.delete({ where: { id } });
  }
}

export const contentService = new ContentService();
